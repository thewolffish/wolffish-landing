import LandingOverlay from "@/components/LandingOverlay";

const RELEASE_BASE = "https://releases.wolffi.sh";

function parseYaml(text: string) {
  const version = text.match(/^version:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const fileUrl = text.match(/^\s+-\s+url:\s*(.+)$/m)?.[1]?.trim() ?? "";
  return { version, fileUrl };
}

async function fetchRelease() {
  try {
    const [mac, win, linux] = await Promise.all([
      fetch(`${RELEASE_BASE}/latest-mac.yml`, { cache: "no-store" }).then((r) => r.text()),
      fetch(`${RELEASE_BASE}/latest.yml`, { cache: "no-store" }).then((r) => r.text()),
      fetch(`${RELEASE_BASE}/latest-linux.yml`, { cache: "no-store" }).then((r) => r.text()),
    ]);
    const macInfo = parseYaml(mac);
    const winInfo = parseYaml(win);
    const linuxInfo = parseYaml(linux);
    const version = macInfo.version || winInfo.version || linuxInfo.version;

    const macDmg =
      mac.match(/^\s+-\s+url:\s*(.+\.dmg)$/m)?.[1]?.trim() ?? macInfo.fileUrl;

    return {
      version,
      files: {
        macos: {
          url: `${RELEASE_BASE}/${macDmg}`,
          filename: macDmg.split("/").pop() ?? "",
        },
        windows: {
          url: `${RELEASE_BASE}/${winInfo.fileUrl}`,
          filename: winInfo.fileUrl.split("/").pop() ?? "",
        },
        linux: {
          url: `${RELEASE_BASE}/${linuxInfo.fileUrl}`,
          filename: linuxInfo.fileUrl.split("/").pop() ?? "",
        },
      },
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const release = await fetchRelease();

  return (
    <main className="relative">
      <LandingOverlay release={release} />
    </main>
  );
}
