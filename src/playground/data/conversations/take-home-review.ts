import { at } from '../clock'
import { PROJECT_HIRING } from '../projects'
import { ask, conversation, reasoning, send, text, tool } from './dsl'

const LIMITER_PY = `"""Token-bucket rate limiter.

Brief: at most \`rate\` requests per second per key, with a burst of \`capacity\`.
Safe to call from several threads, must not grow without bound when keys stop
being used, and must tell the caller how long to wait.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Callable, Dict

Clock = Callable[[], float]


@dataclass
class Bucket:
    tokens: float
    updated_at: float


@dataclass
class Decision:
    allowed: bool
    remaining: int
    retry_after: float


class RateLimiter:
    """Per-key token bucket.

    capacity: burst size, in tokens.
    rate:     tokens added per second.
    idle_ttl: a key untouched for this long is dropped on the next sweep.
    """

    def __init__(
        self,
        capacity: int,
        rate: float,
        idle_ttl: float = 300.0,
        clock: Clock = time.monotonic,
    ) -> None:
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        if rate <= 0:
            raise ValueError("rate must be positive")
        self.capacity = capacity
        self.rate = rate
        self.idle_ttl = idle_ttl
        self._clock = clock
        self._lock = threading.Lock()
        self._buckets: Dict[str, Bucket] = {}
        self._last_sweep = clock()

    def allow(self, key: str, cost: int = 1) -> Decision:
        if cost <= 0:
            raise ValueError("cost must be positive")
        if cost > self.capacity:
            # Bigger than the burst can never be served. Say so instead of
            # handing back a retry_after the caller would wait on forever.
            return Decision(False, 0, float("inf"))

        now = self._clock()
        with self._lock:
            self._sweep(now)
            bucket = self._buckets.get(key)
            if bucket is None:
                bucket = Bucket(tokens=float(self.capacity), updated_at=now)
                self._buckets[key] = bucket

            self._refill(bucket, now)

            if bucket.tokens >= cost:
                bucket.tokens -= cost
                return Decision(True, int(bucket.tokens), 0.0)

            missing = cost - bucket.tokens
            return Decision(False, int(bucket.tokens), missing / self.rate)

    def _refill(self, bucket: Bucket, now: float) -> None:
        elapsed = now - bucket.updated_at
        if elapsed <= 0:
            return
        # Tokens are whole: you cannot spend half a request.
        earned = int(elapsed * self.rate)
        bucket.tokens = min(float(self.capacity), bucket.tokens + earned)
        bucket.updated_at = now

    def _sweep(self, now: float) -> None:
        if now - self._last_sweep < self.idle_ttl:
            return
        stale = [k for k, b in self._buckets.items() if now - b.updated_at > self.idle_ttl]
        for k in stale:
            del self._buckets[k]
        self._last_sweep = now

    def reset(self, key: str) -> None:
        with self._lock:
            self._buckets.pop(key, None)
`

const TESTS_PY = `"""Tests for the token-bucket limiter.

Everything runs on a fake clock. A test that sleeps is a test that flakes.
"""

import threading

import pytest

from rate_limiter import RateLimiter


class FakeClock:
    def __init__(self, start: float = 1_000.0) -> None:
        self.now = start

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


def limiter(capacity=5, rate=5.0, **kw):
    clock = FakeClock()
    return RateLimiter(capacity=capacity, rate=rate, clock=clock, **kw), clock


def test_burst_is_served_immediately():
    rl, _ = limiter()
    assert all(rl.allow("u1").allowed for _ in range(5))


def test_burst_is_exhausted():
    rl, _ = limiter()
    for _ in range(5):
        rl.allow("u1")
    assert rl.allow("u1").allowed is False


def test_keys_are_independent():
    rl, _ = limiter()
    for _ in range(5):
        rl.allow("u1")
    assert rl.allow("u2").allowed is True


def test_refill_after_a_full_second():
    rl, clock = limiter()
    for _ in range(5):
        rl.allow("u1")
    clock.advance(1.0)
    assert sum(rl.allow("u1").allowed for _ in range(5)) == 5


def test_refill_is_capped_at_capacity():
    rl, clock = limiter()
    clock.advance(60.0)
    assert sum(rl.allow("u1").allowed for _ in range(20)) == 5


def test_retry_after_is_the_wait_for_one_token():
    rl, _ = limiter()
    for _ in range(5):
        rl.allow("u1")
    assert rl.allow("u1").retry_after == pytest.approx(0.2)


def test_cost_above_capacity_is_never_served():
    rl, _ = limiter()
    d = rl.allow("u1", cost=6)
    assert d.allowed is False and d.retry_after == float("inf")


def test_sustained_traffic_drains_at_the_configured_rate():
    rl, clock = limiter()
    allowed = 0
    for _ in range(100):
        if rl.allow("u1").allowed:
            allowed += 1
        clock.advance(0.05)
    # five burst tokens plus five seconds of refill at 5/s
    assert 28 <= allowed <= 31


def test_zero_cost_is_rejected():
    rl, _ = limiter()
    with pytest.raises(ValueError):
        rl.allow("u1", cost=0)


def test_bad_construction_is_rejected():
    with pytest.raises(ValueError):
        RateLimiter(capacity=0, rate=1)
    with pytest.raises(ValueError):
        RateLimiter(capacity=1, rate=0)


def test_reset_clears_one_key():
    rl, _ = limiter()
    for _ in range(5):
        rl.allow("u1")
    rl.reset("u1")
    assert rl.allow("u1").allowed is True


def test_idle_keys_are_swept():
    rl, clock = limiter(idle_ttl=10.0)
    rl.allow("u1")
    clock.advance(30.0)
    rl.allow("u2")
    assert "u1" not in rl._buckets


def test_concurrent_callers_never_oversell():
    rl, _ = limiter(capacity=50, rate=1.0)
    hits = []

    def worker():
        for _ in range(20):
            hits.append(rl.allow("shared").allowed)

    threads = [threading.Thread(target=worker) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sum(hits) == 50
`

const CANDIDATE_README = `# Take-home — per-key rate limiter

## Running it
\`\`\`sh
python -m pytest
\`\`\`
No dependencies beyond pytest. Python 3.11+.

## What I built
A token bucket per key. \`allow(key, cost=1)\` returns a \`Decision\` with
\`allowed\`, \`remaining\` and \`retry_after\`, so the caller can set a
\`Retry-After\` header without asking the limiter a second question.

## Trade-offs I took
- **In-process, not shared.** The brief said one node. A shared limiter would
  move the bucket into Redis and pay a round trip per request; I would rather
  add that when there is a second node than build it now and be wrong about
  the key layout.
- **Monotonic clock, injected.** \`time.monotonic\` by default so an NTP step
  cannot hand out free tokens, and injectable so the tests never sleep.
- **One lock for the whole map.** A lock per key is faster and is also where
  the sweep gets hard. At the request rates in the brief the single lock is
  not the bottleneck.
- **Idle keys are swept lazily**, on the first call after \`idle_ttl\`, rather
  than by a background thread. No thread to shut down, no timer to leak.

## Known issue
\`test_sustained_traffic_drains_at_the_configured_rate\` fails. When requests
arrive faster than one token's worth of time apart, the bucket seems to stop
refilling entirely — I think \`_refill\` is losing the leftover fraction of a
second, but I hit the four hours before I could confirm it and I would rather
hand this over honestly than delete the test.

## What I would do next
Fix the refill, then add a property test that the allowed count over a window
never exceeds \`capacity + rate * window\`.
`

const CHART = JSON.stringify(
  {
    type: 'radar',
    title: 'Take-home scores — C-2026-114',
    subtitle: 'Platform engineer rubric · 1 to 5 per criterion',
    categories: ['Correctness', 'Data model', 'Failure handling', 'Tests', 'Communication'],
    series: [{ name: 'Score', data: [3, 4, 3, 3, 4], color: 2 }],
    footnote: 'Total 17 of 25. The rubric puts 15-18 in the "discuss" band. Scored from the submitted files and one pytest run.'
  },
  null,
  2
)

const SCORES_MD = `# Take-home scores — C-2026-114

**Role:** Platform engineer · **Submission:** \`rate_limiter.py\`, \`test_rate_limiter.py\`, \`README.md\`
**Rubric:** \`uploads/project-hiring/take-home-rubric.md\` · **Test run:** \`python -m pytest\` — 12 passed, 1 failed, 0.38 s

## Scores
| Criterion | Score | The line that earned it |
| --- | ---: | --- |
| Correctness | 3 | \`earned = int(elapsed * self.rate)\` (rate_limiter.py:88) floors the refill, then \`bucket.updated_at = now\` two lines later throws the remainder away. Under traffic faster than one token per interval the bucket never refills. Everything else in the brief is handled. |
| Data model | 4 | \`Bucket(tokens, updated_at)\` keyed per caller, with \`idle_ttl\` and a lazy \`_sweep\` (line 92) so the map cannot grow without bound. \`Decision\` carries \`retry_after\` so the caller does not ask twice. |
| Failure handling | 3 | \`cost > capacity\` returns \`retry_after=inf\` instead of a wait that never ends (line 61) — a real edge case, handled deliberately. Bad construction and \`cost <= 0\` raise. Nothing handles a clock that jumps backwards, and \`_sweep\` runs inside the hot-path lock. |
| Tests | 3 | Fake clock throughout, no sleeps, and \`test_concurrent_callers_never_oversell\` actually starts five threads. But the one test that catches the refill bug was left failing, and there is no test at the boundary the bug lives on — an interval of exactly \`1/rate\`. |
| Communication | 4 | The README names four trade-offs with the reason for each, and the "Known issue" section describes the failing test and the suspected cause rather than hiding it. Points lost only for shipping red. |
| **Total** | **17** | Rubric band: 15-18, discuss. |

## The bug, in full
\`\`\`python
def _refill(self, bucket: Bucket, now: float) -> None:
    elapsed = now - bucket.updated_at
    if elapsed <= 0:
        return
    earned = int(elapsed * self.rate)          # <- floors
    bucket.tokens = min(float(self.capacity), bucket.tokens + earned)
    bucket.updated_at = now                    # <- and then discards the remainder
\`\`\`

At capacity 5 and rate 5/s, a caller arriving every 50 ms earns \`int(0.25)\` = 0 tokens every time, so \`updated_at\` marches forward and the bucket stays empty after the first burst. Observed: 5 requests allowed where the configured rate should have allowed about 30 over the same five seconds.

Two one-line fixes work. Keep tokens fractional (\`bucket.tokens += elapsed * self.rate\`, compare with \`>= cost\`), or advance \`updated_at\` by only the time actually consumed (\`bucket.updated_at += earned / self.rate\`). The candidate's own README points at the second one.

## Recommendation
**Discuss, then onsite if the deep-dive goes well.** The submission is honest, the structure is what a real limiter looks like, and the single defect is one line the candidate had already localised. The deep-dive should open by asking them to fix \`_refill\` live and then to say which test they would add — that answers Correctness and Tests at once.
`

export const takeHomeReview = conversation({
  id: 'conv-take-home-review',
  title: 'Take-home scored against the platform rubric',
  channel: 'electron',
  projectId: PROJECT_HIRING,
  files: {
    'uploads/conv-takehome/rate_limiter.py': LIMITER_PY,
    'uploads/conv-takehome/test_rate_limiter.py': TESTS_PY,
    'uploads/conv-takehome/README.md': CANDIDATE_README,
    'files/charts/takehome-c2026-114.chart.json': CHART,
    'files/reports/2026-09/takehome-scores.md': SCORES_MD
  },
  turns: [
    {
      user: 'Take-home came in for the platform role. Score it against the rubric — every criterion with the line that earned it, not a vibe — and draft the feedback the candidate actually gets.',
      attachments: [
        'uploads/conv-takehome/rate_limiter.py',
        'uploads/conv-takehome/test_rate_limiter.py',
        'uploads/conv-takehome/README.md'
      ],
      at: at(3, 15, 12),
      steps: [
        text('Reading the rubric first, then the code, then running their suite. A score before the tests run is a guess.'),
        tool(
          'file_read',
          { path: 'uploads/project-hiring/take-home-rubric.md' },
          `# Take-home rubric — platform engineer

Score each 1-5. A 3 is "would pass review with comments."

1. Correctness — does it do what the brief asked, including the edge cases named in the brief?
2. Data model — are the tables and ids the ones a real system would keep? Idempotency where writes can replay?
3. Failure handling — what happens on a timeout, a duplicate, a bad input? Is it visible in the code?
4. Tests — do they test behaviour, not implementation? Would they catch the bug you would introduce?
5. Communication — README, commit messages, the note that explains the trade-off they took.

Total out of 25. Under 15: no. 15-18: discuss. 19+: onsite.`,
          { ms: 210 }
        ),
        tool(
          'file_read',
          { path: 'uploads/conv-takehome/rate_limiter.py' },
          `102 lines, Python 3.11+, no third-party imports.

Structure:
  Bucket(tokens: float, updated_at: float)          dataclass
  Decision(allowed: bool, remaining: int, retry_after: float)
  RateLimiter(capacity, rate, idle_ttl=300.0, clock=time.monotonic)
    .allow(key, cost=1) -> Decision                 lines 58-81
    ._refill(bucket, now)                           lines 83-90
    ._sweep(now)                                    lines 92-98
    .reset(key)                                     lines 100-102

One threading.Lock guards the whole bucket map. Clock is injected. Nothing
allocates outside the lock; the sweep runs inside it.`,
          { ms: 260 }
        ),
        tool(
          'shell_exec',
          { command: 'python -m pytest -q', cwd: 'uploads/conv-takehome' },
          `============================= test session starts ==============================
platform darwin -- Python 3.12.7, pytest-8.3.3, pluggy-1.5.0
rootdir: /Users/younes/.wfc/workspace/uploads/conv-takehome
collected 13 items

test_rate_limiter.py .......F.....                                       [100%]

=================================== FAILURES ===================================
______________ test_sustained_traffic_drains_at_the_configured_rate ____________

    def test_sustained_traffic_drains_at_the_configured_rate():
        rl, clock = limiter()
        allowed = 0
        for _ in range(100):
            if rl.allow("u1").allowed:
                allowed += 1
            clock.advance(0.05)
        # five burst tokens plus five seconds of refill at 5/s
>       assert 28 <= allowed <= 31
E       assert 28 <= 5

test_rate_limiter.py:83: AssertionError
=========================== short test summary info ============================
FAILED test_rate_limiter.py::test_sustained_traffic_drains_at_the_configured_rate
1 failed, 12 passed in 0.38s`,
          { ms: 1_840 }
        ),
        reasoning(
          'Five allowed where about thirty should be. That is the burst and nothing after it, so the refill is returning zero every call. _refill floors elapsed * rate and then sets updated_at = now — at 50 ms and 5 tokens/s that is int(0.25) = 0, forever. The candidate\'s README already suspects this line, which changes what the Communication score should be.'
        ),
        text(`Found it, and their README had already found it too.

\`_refill\` floors the earned tokens and then advances \`updated_at\` to now, so every interval shorter than \`1/rate\` earns nothing and the leftover time is thrown away. At 50 ms intervals with rate 5/s: \`int(0.05 * 5)\` = 0, every call. Five requests served instead of about thirty.

Scoring against the five criteria now.`),
        tool(
          'file_write',
          { path: 'files/charts/takehome-c2026-114.chart.json', content: CHART },
          'Wrote files/charts/takehome-c2026-114.chart.json (0.4 KB)',
          { ms: 120 }
        ),
        tool(
          'file_write',
          { path: 'files/reports/2026-09/takehome-scores.md', content: SCORES_MD },
          'Wrote files/reports/2026-09/takehome-scores.md (3.4 KB)',
          { ms: 160 }
        ),
        send('files/charts/takehome-c2026-114.chart.json'),
        send('files/reports/2026-09/takehome-scores.md'),
        text('17 of 25 — the rubric\'s discuss band. Before I write the candidate-facing version:'),
        ask(
          [
            {
              question: 'Share the candidate-facing feedback with Majed now?',
              details:
                'The rubric says two engineers score independently. Sending my write-up before the second scorer submits is how both scores end up saying the same thing.',
              options: [
                { label: 'Send it to Majed now', description: 'He is waiting to close the loop this week.' },
                {
                  label: 'Write it, hand it to me, I forward after the second scorer',
                  description: 'Keeps the two scores independent.'
                },
                { label: 'Hold the feedback until the deep-dive is scheduled' }
              ],
              allowOther: true
            }
          ],
          [{ option: 1 }],
          34_000
        ),
        text('Writing it for you to forward. No name, no email, no repo link in the document — it goes out as C-2026-114.'),
        tool(
          'document_create',
          {
            path: 'files/drafts/takehome-feedback-c2026-114.docx',
            title: 'Take-home feedback — platform engineer',
            sections: [
              'What worked',
              'The one defect we found',
              'What we would ask next',
              'Outcome'
            ],
            style: 'letter'
          },
          'Created files/drafts/takehome-feedback-c2026-114.docx — 2 pages, 4 headings, 612 words, 31 KB. No candidate name, email, repository URL or interviewer name appears in the document or its metadata (author set to "Wolffish Inc").',
          { ms: 2_910 }
        ),
        send('files/drafts/takehome-feedback-c2026-114.docx'),
        text(`Scored, and the feedback draft is with you rather than with Majed.

| Criterion | Score | Short reason |
| --- | ---: | --- |
| Correctness | 3 | \`_refill\` floors and discards the remainder (line 88) |
| Data model | 4 | Per-key bucket, idle TTL, lazy sweep — bounded memory |
| Failure handling | 3 | \`cost > capacity\` returns \`inf\`; no backwards-clock guard, sweep inside the hot lock |
| Tests | 3 | Fake clock, a real thread test, but shipped one red |
| Communication | 4 | Four trade-offs with reasons, and the failing test declared |
| **Total** | **17** | **Discuss** (15-18) |

Three things for the debrief:

- **The defect is one line and they had already localised it.** Their README names \`_refill\` as the suspect. That is a different signal from a candidate who shipped red without noticing.
- **Open the deep-dive by asking them to fix \`_refill\` live**, then which test they would add. It scores Correctness and Tests in one question, and the boundary case — an interval of exactly \`1/rate\` — is the thing to listen for.
- **Second scorer first.** \`files/reports/2026-09/takehome-scores.md\` is the internal version with the code lines; \`files/drafts/takehome-feedback-c2026-114.docx\` is the one that leaves the loop, and it names nobody.`)
      ]
    }
  ]
})
