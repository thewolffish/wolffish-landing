'use client'

import { Button } from '@/playground/components/core/Button'
import { Tooltip } from '@/playground/components/core/Tooltip'
import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'
import { useDemo, useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { orgOwns } from '@/playground/pages/settings/OrgManagedNotice'
import { EXTENSION_STATUS } from '@/playground/data/services'
import { WORKSPACE_ROOT } from '@/playground/data/identity'
import type {
  BrowserExtensionConfig,
  ExtensionBrowserInfo,
  ExtensionConnectionStatus,
  ExtensionServerStatus
} from '@/playground/data/types'
import { ArrowDown01Icon, FolderOpenIcon, RefreshIcon, Tick02Icon } from 'hugeicons-react'
import { useCallback, useState } from 'react'

// The browser brand marks, inlined as data URIs so the panel carries its own
// art (the desktop imports them from src/renderer/src/assets/browsers).
const braveIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNzcwIDI3NzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB5MT0iNTElIiB5Mj0iNTElIj48c3RvcCBvZmZzZXQ9Ii40IiBzdG9wLWNvbG9yPSIjZjUwIi8+PHN0b3Agb2Zmc2V0PSIuNiIgc3RvcC1jb2xvcj0iI2ZmMjAwMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iMiUiIHkxPSI1MSUiIHkyPSI1MSUiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZmNDUyYSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZmMjAwMCIvPjwvbGluZWFyR3JhZGllbnQ+PHBhdGggZmlsbD0idXJsKCNhKSIgZD0iTTIzOTUgNzIzbDYwLTE0Ny0xNzAtMTc2Yy05Mi05Mi0yODgtMzgtMjg4LTM4bC0yMjItMjUySDk5Mkw3NjkgMzYzcy0xOTYtNTMtMjg4IDM3TDMxMSA1NzVsNjAgMTQ3LTc1IDIxOCAyNTAgOTUzYzUyIDIwNCA4NyAyODMgMjM0IDM4N2w0NTcgMzEwYzQ0IDI3IDk4IDc0IDE0NyA3NHMxMDMtNDcgMTQ3LTc0bDQ1Ny0zMTBjMTQ3LTEwNCAxODItMTgzIDIzNC0zODdsMjUwLTk1M3oiLz48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMTkzNSA1MjRzMjg3IDM0NyAyODcgNDIwYzAgNzUtMzYgOTQtNzIgMTMzbC0yMTUgMjMwYy0yMCAyMC02MyA1NC0zOCAxMTMgMjUgNjAgNjAgMTM0IDIwIDIxMC00MCA3Ny0xMTAgMTI4LTE1NSAxMjBhODIwIDgyMCAwIDAxLTE5MC05MGMtMzgtMjUtMTYwLTEyNi0xNjAtMTY1czEyNi0xMTAgMTUwLTEyNGMyMy0xNiAxMzAtNzggMTMyLTEwMnMyLTMwLTMwLTkwLTg4LTE0MC04MC0xOTJjMTAtNTIgMTAwLTgwIDE2Ny0xMDVsMjA3LTc4YzE2LTggMTItMTUtMzYtMjAtNDgtNC0xODMtMjItMjQ0LTVzLTE2MyA0My0xNzMgNTdjLTggMTQtMTYgMTQtNyA2Mmw1OCAzMTVjNCA0MCAxMiA2Ny0zMCA3Ny00NCAxMC0xMTcgMjctMTQyIDI3cy05OS0xNy0xNDItMjctMzUtMzctMzAtNzdjNC00MCA0OC0yNjggNTctMzE1IDEwLTQ4IDEtNDgtNy02Mi0xMC0xNC0xMTMtNDAtMTc0LTU3LTYwLTE3LTE5NiAxLTI0NCA2LTQ4IDQtNTIgMTAtMzYgMjBsMjA3IDc3YzY2IDI1IDE1OCA1MyAxNjcgMTA1IDEwIDUzLTQ3IDEzMi04MCAxOTJzLTMyIDY2LTMwIDkwIDExMCA4NiAxMzIgMTAyYzI0IDE1IDE1MCA4NSAxNTAgMTI0cy0xMTkgMTQwLTE1OSAxNjVhODIwIDgyMCAwIDAxLTE5MCA5MGMtNDUgOC0xMTUtNDMtMTU2LTEyMC00MC03Ni00LTE1MCAyMC0yMTAgMjUtNjAtMTctOTItMzgtMTEzbC0yMTUtMjMwYy0zNS0zNy03MS01Ny03MS0xMzFzMjg3LTQyMCAyODctNDIwbDI3MyA0NGMzMiAwIDEwMy0yNyAxNjgtNTAgNjUtMjAgMTEwLTIyIDExMC0yMnM0NCAwIDExMCAyMiAxMzYgNTAgMTY4IDUwYzMzIDAgMjc1LTQ3IDI3NS00N3ptLTIxNSAxMzI4YzE4IDEwIDcgMzItMTAgNDRsLTI1NCAxOThjLTIwIDIwLTUyIDUwLTczIDUwcy01Mi0zMC03My01MGExMzIwMCAxMzIwMCAwIDAwLTI1NS0xOThjLTE2LTEyLTI3LTMzLTEwLTQ0bDE1MC04MGE4NzAgODcwIDAgMDExODgtNzNjMTUgMCAxMTAgMzQgMTg3IDczbDE1MCA4MHoiLz48cGF0aCBmaWxsPSJ1cmwoI2IpIiBkPSJNMTk5OSAzNjNsLTIyNC0yNTNIOTkyTDc2OSAzNjNzLTE5Ni01My0yODggMzdjMCAwIDI2MC0yMyAzNTAgMTIzbDI3NiA0N2MzMiAwIDEwMy0yNyAxNjgtNTAgNjUtMjAgMTEwLTIyIDExMC0yMnM0NCAwIDExMCAyMiAxMzYgNTAgMTY4IDUwYzMzIDAgMjc1LTQ3IDI3NS00NyA5MC0xNDYgMzUwLTEyMyAzNTAtMTIzLTkyLTkyLTI4OC0zOC0yODgtMzgiLz48L3N2Zz4='

const chromeIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9Ii0wLjgyIDAgNDM3LjQ2IDQzNy40NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjE3LjM0MS4wMzlzMTI4LjQ3OC01Ljc4MyAxOTYuNTcgMTIzLjMzN0gyMDYuNDE2cy0zOS4xODgtMS4yODktNzIuNTkzIDQ2LjI1NWMtOS42MzQgMTkuOTE2LTE5LjkxIDQwLjQ3My04LjM0OSA4MC45MzdDMTA4Ljc3MyAyMjIuMzA5IDM2LjgyMyA5Ny4wNCAzNi44MjMgOTcuMDRTODcuNTc4IDUuMTc2IDIxNy4zNDEuMDM5eiIgZmlsbD0iI2M2MzUyZSIvPjxwYXRoIGQ9Ik00MDcuMjIzIDMyNy44NzFzLTU5LjI0NyAxMTQuMTQzLTIwNS4xMTggMTA4LjUzM2MxNy45OTUtMzEuMTQ4IDEwMy43NzItMTc5LjY4MiAxMDMuNzcyLTE3OS42ODJzMjAuNzA5LTMzLjI4OS0zLjc0NC04NS45OTFjLTEyLjQzMS0xOC4zMDUtMjUuMDktMzcuNDg2LTY1LjkxOS00Ny43MTMgMzIuODM2LS4zMjYgMTc3LjI4NS4wMjEgMTc3LjI4NS4wMjFzNTQuMTY4IDg5Ljg5MS02LjI3NiAyMDQuODMyeiIgZmlsbD0iI2Y0ZDkxMSIvPjxwYXRoIGQ9Ik0yOC4zNzMgMzI4LjczOHMtNjkuMjI0LTEwOC4zOTUgOC41OC0yMzEuOTA4YzE3Ljk3OSAzMS4xNiAxMDMuNzEgMTc5LjcyIDEwMy43MSAxNzkuNzJzMTguNDY5IDM0LjU3OCA3Ni4zNDEgMzkuNzU2YzIyLjA2MS0xLjYwOSA0NS4wMDctMi45ODIgNzQuMjc5LTMzLjIyMy0xNi4xMzkgMjguNTk0LTg4LjY3MyAxNTMuNTIxLTg4LjY3MyAxNTMuNTIxUzk3LjY4MSA0MzguNTYgMjguMzczIDMyOC43Mzh6IiBmaWxsPSIjODFiMzU0Ii8+PHBhdGggZD0iTTIwMi4xMDUgNDM3LjQ2bDI5LjE4Ny0xMjEuNzkzczMyLjA5Mi0yLjUwNCA1OC45ODItMzIuMDE3Yy0xNi42OTMgMjkuMzY1LTg4LjE2OSAxNTMuODEtODguMTY5IDE1My44MXoiIGZpbGw9IiM3YmFhNTAiLz48cGF0aCBkPSJNMTE5LjU5IDIyMC4wOTNjMC01My42OSA0My41Mi05Ny4yMTUgOTcuMjE1LTk3LjIxNSA1My42OSAwIDk3LjIxNCA0My41MjQgOTcuMjE0IDk3LjIxNSAwIDUzLjY5My00My41MjIgOTcuMjE5LTk3LjIxNCA5Ny4yMTktNTMuNjk1IDAtOTcuMjE1LTQzLjUyNS05Ny4yMTUtOTcuMjE5eiIgZmlsbD0iI2ZmZmZmZiIvPjxsaW5lYXJHcmFkaWVudCBpZD0iYSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSItODI5LjEyOCIgeTE9IjE0MTcuMzM5IiB4Mj0iLTgyOS4xMjgiIHkyPSIxMjYxLjQ0MSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAtMSAxMDQ1LjkzIDE1NTcuNjM2KSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjYTJjMGU2Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDA2Y2IxIi8+PC9saW5lYXJHcmFkaWVudD48cGF0aCBkPSJNMTM1Ljg2IDIyMC4wOTNjMC00NC43MDIgMzYuMjM4LTgwLjk0MSA4MC45NDUtODAuOTQxIDQ0LjY5OCAwIDgwLjk0IDM2LjIzOSA4MC45NCA4MC45NDEgMCA0NC43MDMtMzYuMjQyIDgwLjk0NS04MC45NCA4MC45NDUtNDQuNzA3LjAwMS04MC45NDUtMzYuMjQ0LTgwLjk0NS04MC45NDV6IiBmaWxsPSJ1cmwoI2EpIi8+PHBhdGggZD0iTTQxMy41IDEyMy4wMzlsLTEyMC4xODMgMzUuMjM3cy0xOC4xMjMtMjYuNTk2LTU3LjEwNC0zNS4yNThjMzMuNzc2LS4xMTUgMTc3LjI4Ny4wMjEgMTc3LjI4Ny4wMjF6IiBmaWxsPSIjZTdjZTEyIi8+PHBhdGggZD0iTTEyMy4xMzcgMjQ2LjE5N2MtMTYuODktMjkuMjUtODYuMzEtMTQ5LjE2LTg2LjMxLTE0OS4xNmw4OS4wMjkgODguMDdzLTkuMTQ5IDE4LjgyLTUuNjggNDUuN2wyLjk2MSAxNS4zOXoiIGZpbGw9IiNiYzMzMmMiLz48L3N2Zz4='

const chromiumIcon =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCmFyaWEtbGFiZWw9IkNocm9taXVtIiByb2xlPSJpbWciCnZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjYTJjMmZhIiBkPSJNMjU2IDE0MGgyMjhhMjU2IDI1NiAwIDAxLTI0MCAzNzEuNyIvPjxwYXRoIGZpbGw9IiM2MTk5ZjYiIGQ9Ik0zNTcgMzE0TDI0NCA1MTEuN0EyNTYgMjU2IDAgMDE0MCAxMTgiLz48cGF0aCBmaWxsPSIjMzk2YmQ3IiBkPSJNMjU2IDE0MGgyMjhhMjU2IDI1NiAxIDAwLTQ0NC0yMmwxMTUgMTk2Ii8+PGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSIxMDUiIGZpbGw9IiM0Njg3ZjQiIHN0cm9rZT0iI2YxZjFmMSIgc3Ryb2tlLXdpZHRoPSIyNCIvPjwvc3ZnPg=='

const edgeIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjE4MzYgMTMuNDM2SDIwLjA5OEMyMC4wOTggOS45MTYxMyAxOC41NjIxIDcuNTE2MzYgMTQuMzc0MyA3LjUxNjM2QzkuNDI1MzcgNy41MTYzNCA0LjM5MjYgMTAuNzM4MSAyIDE0Ljc1NTNDMi43NDExMSA3Ljc4MjY2IDcuNzQwNTMgMi4xNTMzMiAxNS4yNjczIDIuMTUzMzJDMjEuNzE4NiAyLjE1MzMyIDI3LjgzMDkgNy4wODU4NSAyNy44MzA5IDE1LjI4NTNWMTguNDAyNkgxMC4yMzY0QzEwLjIzNjQgMjIuNjQ1NiAxMy45Mzc3IDI0LjMyNjcgMTcuODE0MiAyNC4zMjY3QzIyLjUzMTcgMjQuMzI2NyAyNS40NTMyIDIyLjIwNjggMjUuNDUzMiAyMi4yMDY4VjI4LjE1QzI1LjQ1MzIgMjguMTUgMjIuMTU1MiAzMC4xNTMzIDE2Ljg5ODUgMzAuMTUzM0MxMC4wNjcyIDMwLjE1MzMgNS4yNDUxNyAyNS4yNTc2IDUuMjQ1MTcgMTkuMTY5N0M1LjI0NTE3IDE0LjM5MTEgOC4xMzU2NCAxMC41NzU5IDEyLjEzOTMgOS4wMDE2NUMxMC4xOTA0IDExLjE0MiAxMC4xODM1IDEzLjQzNiAxMC4xODM1IDEzLjQzNkgxMC4xODM2WiIgZmlsbD0iIzEzN0FENCIvPgo8L3N2Zz4='

const firefoxIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI4Ljk5MDUgMTAuNzI2NUMyOC4zODE2IDkuMjU3NCAyNy4xNDczIDcuNjcxMzkgMjYuMTc4NCA3LjE3MDM5QzI2Ljk2NyA4LjcyMDE1IDI3LjQyMzIgMTAuMjc0NiAyNy41OTc2IDExLjQzNDRDMjcuNTk3NiAxMS40MzQ0IDI3LjU5NzYgMTEuNDQyNiAyNy42MDA1IDExLjQ1NzhDMjYuMDE1NiA3LjQ5Nzc3IDIzLjMyNzcgNS45MDA2NSAyMS4xMzI3IDIuNDI0MDdDMjEuMDIxMyAyLjI0ODY5IDIwLjkxMDUgMi4wNzMzMSAyMC44MDIgMS44ODU2NkMyMC43NDA3IDEuNzc5ODUgMjAuNjkxMSAxLjY4Mzk3IDIwLjY0OCAxLjU5MzM2QzIwLjU1NyAxLjQxNzU3IDIwLjQ4NjcgMS4yMzE3OSAyMC40Mzg2IDEuMDM5NzVDMjAuNDM5IDEuMDMwNjMgMjAuNDM1OSAxLjAyMTY5IDIwLjQzMDEgMS4wMTQ2N0MyMC40MjQzIDEuMDA3NjUgMjAuNDE2MSAxLjAwMzA1IDIwLjQwNzEgMS4wMDE3NUMyMC4zOTg1IDAuOTk5NDE2IDIwLjM4OTQgMC45OTk0MTYgMjAuMzgwOCAxLjAwMTc1QzIwLjM3ODUgMS4wMDI4MSAyMC4zNzYzIDEuMDA0MTkgMjAuMzc0NCAxLjAwNTg0QzIwLjM3MDkgMS4wMDU4NCAyMC4zNjc0IDEuMDA5OTQgMjAuMzYzOSAxLjAxMTFMMjAuMzY5NyAxLjAwMzVDMTYuODQ4MyAzLjA3MDYzIDE1LjY1MzYgNi44OTQ0NiAxNS41NDQgOC44MDc4NEMxNC4xMzY4IDguOTA0MjggMTIuNzkxMyA5LjQyMzU4IDExLjY4MyAxMC4yOThDMTEuNTY3MiAxMC4xOTk4IDExLjQ0NjEgMTAuMTA4MSAxMS4zMjAyIDEwLjAyMzJDMTEuMDAwOCA4LjkwMjcgMTAuOTg3MyA3LjcxNjgzIDExLjI4MTEgNi41ODkzMUM5Ljg0MDkxIDcuMjQ2OTcgOC43MjA5NSA4LjI4NDYzIDcuOTA2NjQgOS4yMDMwM0g3LjkwMDIzQzcuMzQ0MzMgOC40OTc0MiA3LjM4MzQxIDYuMTcwMTUgNy40MTQ5MSA1LjY4NDM1QzcuNDA4NDkgNS42NTM5NSA3LjAwMDc2IDUuODk2NTYgNi45NDgyNiA1LjkzMzM5QzYuNDU3NzMgNi4yODQxIDUuOTk5MiA2LjY3NzcxIDUuNTc4MDUgNy4xMDk2QzUuMDk4OCA3LjU5NjU1IDQuNjYwOTYgOC4xMjI3NiA0LjI2OTA5IDguNjgyNzRDMy4zNjc1MiA5Ljk2MzIzIDIuNzI4MTQgMTEuNDEwMSAyLjM4NzkgMTIuOTM5OEMyLjM4MTQ5IDEyLjk3MDIgMi4zNzU2NSAxMy4wMDE3IDIuMzY5MjQgMTMuMDMyN0MyLjM0Mjk5IDEzLjE1NjEgMi4yNDc5MSAxMy43NzUxIDIuMjMwOTkgMTMuOTA5NlYxMy45NDA2QzIuMTA3MDQgMTQuNTgwMyAyLjAyOTg0IDE1LjIyODIgMiAxNS44NzkxVjE1Ljk1MUMyIDIzLjcwOTcgOC4yNzY0NiAzMCAxNi4wMTgyIDMwQzIyLjk1MjEgMzAgMjguNzA4OCAyNC45NTQ5IDI5LjgzNjQgMTguMzI4QzI5Ljg1OTcgMTguMTQ4NSAyOS44Nzg5IDE3Ljk2NzMgMjkuODk5OSAxNy43ODZDMzAuMTc4OCAxNS4zNzYzIDI5Ljg2OSAxMi44NDM5IDI4Ljk5MDUgMTAuNzI2NVpNMTIuODMyNyAyMS43MjM5QzEyLjg5ODEgMjEuNzU0OSAxMi45NTk5IDIxLjc4OTQgMTMuMDI3IDIxLjgxOTdMMTMuMDM2MyAyMS44MjU2QzEyLjk2OTIgMjEuNzkyOSAxMi45MDEgMjEuNzU5IDEyLjgzMzMgMjEuNzIzOUgxMi44MzI3Wk0yNy42MDE3IDExLjQ2NDJWMTEuNDUwOFYxMS40NjZWMTEuNDY0MloiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl84N183MTE4KSIvPgo8cGF0aCBkPSJNMjguOTkwNyAxMC43MjY1QzI4LjM4MTggOS4yNTc0MSAyNy4xNDc1IDcuNjcxNDEgMjYuMTc4NiA3LjE3MDQxQzI2Ljk2NzIgOC43MjAxNyAyNy40MjM0IDEwLjI3NDYgMjcuNTk3OCAxMS40MzQ0VjExLjQ2MzFDMjguOTIwOCAxNS4wNTcyIDI4LjE5OTggMTguNzEyMSAyNy4xNjE1IDIwLjk0NTJDMjUuNTU1IDI0LjQwMDIgMjEuNjY2MSAyNy45NDE2IDE1LjU3OCAyNy43NjkyQzkuMDA1ODEgMjcuNTgyMSAzLjIxMTc1IDIyLjY4ODUgMi4xMjk3IDE2LjI4NDJDMS45MzI1NCAxNS4yNzM1IDIuMTI5NyAxNC43NjA4IDIuMjI4ODYgMTMuOTQwNkMyLjEwODEyIDE0LjU3MjUgMi4wNjIwMyAxNC43NTU1IDIuMDAxOTUgMTUuODc5MVYxNS45NTFDMi4wMDE5NSAyMy43MDk4IDguMjc4NDIgMzAgMTYuMDIwMiAzMEMyMi45NTQgMzAgMjguNzEwOCAyNC45NTQ5IDI5LjgzODMgMTguMzI4QzI5Ljg2MTYgMTguMTQ4NSAyOS44ODA5IDE3Ljk2NzMgMjkuOTAxOSAxNy43ODYxQzMwLjE3OSAxNS4zNzY0IDI5Ljg2OTIgMTIuODQzOSAyOC45OTA3IDEwLjcyNjVaIiBmaWxsPSJ1cmwoI3BhaW50MV9yYWRpYWxfODdfNzExOCkiLz4KPHBhdGggZD0iTTI4Ljk5MDcgMTAuNzI2NUMyOC4zODE4IDkuMjU3NDEgMjcuMTQ3NSA3LjY3MTQxIDI2LjE3ODYgNy4xNzA0MUMyNi45NjcyIDguNzIwMTcgMjcuNDIzNCAxMC4yNzQ2IDI3LjU5NzggMTEuNDM0NFYxMS40NjMxQzI4LjkyMDggMTUuMDU3MiAyOC4xOTk4IDE4LjcxMjEgMjcuMTYxNSAyMC45NDUyQzI1LjU1NSAyNC40MDAyIDIxLjY2NjEgMjcuOTQxNiAxNS41NzggMjcuNzY5MkM5LjAwNTgxIDI3LjU4MjEgMy4yMTE3NSAyMi42ODg1IDIuMTI5NyAxNi4yODQyQzEuOTMyNTQgMTUuMjczNSAyLjEyOTcgMTQuNzYwOCAyLjIyODg2IDEzLjk0MDZDMi4xMDgxMiAxNC41NzI1IDIuMDYyMDMgMTQuNzU1NSAyLjAwMTk1IDE1Ljg3OTFWMTUuOTUxQzIuMDAxOTUgMjMuNzA5OCA4LjI3ODQyIDMwIDE2LjAyMDIgMzBDMjIuOTU0IDMwIDI4LjcxMDggMjQuOTU0OSAyOS44MzgzIDE4LjMyOEMyOS44NjE2IDE4LjE0ODUgMjkuODgwOSAxNy45NjczIDI5LjkwMTkgMTcuNzg2MUMzMC4xNzkgMTUuMzc2NCAyOS44NjkyIDEyLjg0MzkgMjguOTkwNyAxMC43MjY1WiIgZmlsbD0idXJsKCNwYWludDJfcmFkaWFsXzg3XzcxMTgpIi8+CjxwYXRoIGQ9Ik0yMi4xNzc2IDEyLjM3NzNDMjIuMjA4NSAxMi4zOTg5IDIyLjIzNTkgMTIuNDIwNSAyMi4yNjUxIDEyLjQ0MjJDMjEuOTEzMyAxMS44MTYxIDIxLjQ3NDkgMTEuMjQzIDIwLjk2MzEgMTAuNzM5OEMxNi42MDU4IDYuMzcyOTIgMTkuODIxIDEuMjcwNTggMjAuMzYyOSAxLjAxMTAyTDIwLjM2ODcgMS4wMDM0MkMxNi44NDczIDMuMDcwNTQgMTUuNjUyNiA2Ljg5NDM4IDE1LjU0MyA4LjgwNzc2QzE1LjcwNjMgOC43OTY2NSAxNS44NjkgOC43ODI2MiAxNi4wMzUzIDguNzgyNjJDMTguNjYzMSA4Ljc4MjYyIDIwLjk1MiAxMC4yMzEyIDIyLjE3NzYgMTIuMzc3M1oiIGZpbGw9InVybCgjcGFpbnQzX3JhZGlhbF84N183MTE4KSIvPgo8cGF0aCBkPSJNMTYuMDQ0NiAxMy4yNDk5QzE2LjAyMTkgMTMuNjAwNiAxNC43ODk5IDE0LjgwNDkgMTQuMzU4OSAxNC44MDQ5QzEwLjM3MjUgMTQuODA0OSA5LjcyNTU5IDE3LjIyMTYgOS43MjU1OSAxNy4yMjE2QzkuOTAwNTggMTkuMjU3MiAxMS4zMTU3IDIwLjkzMzIgMTMuMDI3NyAyMS44MkMxMy4xMDU5IDIxLjg2MDQgMTMuMTg0NiAyMS44OTY2IDEzLjI2MTEgMjEuOTMyOUMxMy4zOTgxIDIxLjk5MTMgMTMuNTM1OCAyMi4wNDk4IDEzLjY3MjkgMjIuMTAxOEMxNC4yNiAyMi4zMDk0IDE0Ljg3NDggMjIuNDI3NiAxNS40OTY5IDIyLjQ1MjZDMjIuNDgzOCAyMi43ODExIDIzLjgzODMgMTQuMDggMTguNzk1NSAxMS41NTM0QzIwLjA4NjQgMTEuMzI4MyAyMS40MjY5IDExLjg0OTIgMjIuMTc1MyAxMi4zNzU5QzIwLjk1MDMgMTAuMjI5OSAxOC42NjA4IDguNzgxMjUgMTYuMDMzIDguNzgxMjVDMTUuODY2NyA4Ljc4MTI1IDE1LjcwNCA4Ljc5NTI4IDE1LjU0MDYgOC44MDYzOUMxNC4xMzQ1IDguOTA0MDMgMTIuNzkwMyA5LjQyMzkgMTEuNjgzMiAxMC4yOTgzQzExLjg5NzMgMTAuNDgwMSAxMi4xMzg4IDEwLjcyMjEgMTIuNjQ2OCAxMS4yMjM3QzEzLjYgMTIuMTY2MSAxNi4wMzk0IDEzLjEzNTkgMTYuMDQ0NiAxMy4yNDk5WiIgZmlsbD0idXJsKCNwYWludDRfcmFkaWFsXzg3XzcxMTgpIi8+CjxwYXRoIGQ9Ik0xNi4wNDQ2IDEzLjI0OTlDMTYuMDIxOSAxMy42MDA2IDE0Ljc4OTkgMTQuODA0OSAxNC4zNTg5IDE0LjgwNDlDMTAuMzcyNSAxNC44MDQ5IDkuNzI1NTkgMTcuMjIxNiA5LjcyNTU5IDE3LjIyMTZDOS45MDA1OCAxOS4yNTcyIDExLjMxNTcgMjAuOTMzMiAxMy4wMjc3IDIxLjgyQzEzLjEwNTkgMjEuODYwNCAxMy4xODQ2IDIxLjg5NjYgMTMuMjYxMSAyMS45MzI5QzEzLjM5ODEgMjEuOTkxMyAxMy41MzU4IDIyLjA0OTggMTMuNjcyOSAyMi4xMDE4QzE0LjI2IDIyLjMwOTQgMTQuODc0OCAyMi40Mjc2IDE1LjQ5NjkgMjIuNDUyNkMyMi40ODM4IDIyLjc4MTEgMjMuODM4MyAxNC4wOCAxOC43OTU1IDExLjU1MzRDMjAuMDg2NCAxMS4zMjgzIDIxLjQyNjkgMTEuODQ5MiAyMi4xNzUzIDEyLjM3NTlDMjAuOTUwMyAxMC4yMjk5IDE4LjY2MDggOC43ODEyNSAxNi4wMzMgOC43ODEyNUMxNS44NjY3IDguNzgxMjUgMTUuNzA0IDguNzk1MjggMTUuNTQwNiA4LjgwNjM5QzE0LjEzNDUgOC45MDQwMyAxMi43OTAzIDkuNDIzOSAxMS42ODMyIDEwLjI5ODNDMTEuODk3MyAxMC40ODAxIDEyLjEzODggMTAuNzIyMSAxMi42NDY4IDExLjIyMzdDMTMuNiAxMi4xNjYxIDE2LjAzOTQgMTMuMTM1OSAxNi4wNDQ2IDEzLjI0OTlaIiBmaWxsPSJ1cmwoI3BhaW50NV9yYWRpYWxfODdfNzExOCkiLz4KPHBhdGggZD0iTTExLjAzMTEgOS44MzA5M0MxMS4xNDQ4IDkuOTA0NTkgMTEuMjM4MiA5Ljk2NjU2IDExLjMyMjcgMTAuMDIzM0MxMS4wMDM0IDguOTAyNzUgMTAuOTg5OSA3LjcxNjg4IDExLjI4MzcgNi41ODkzNkM5Ljg0MzQ1IDcuMjQ3MDIgOC43MjM0OSA4LjI4NDY4IDcuOTA5MTggOS4yMDMwOEM3Ljk3NTA5IDkuMjAxMzIgMTAuMDA4NSA5LjE2NDQ5IDExLjAzMTEgOS44MzA5M1oiIGZpbGw9InVybCgjcGFpbnQ2X3JhZGlhbF84N183MTE4KSIvPgo8cGF0aCBkPSJNMi4xMjk3IDE2LjI4NEMzLjIxMTc1IDIyLjY4ODMgOS4wMDU4MSAyNy41ODE5IDE1LjU4MjcgMjcuNzY5QzIxLjY3MDcgMjcuOTQxNCAyNS41NTc0IDI0LjQgMjcuMTY2MSAyMC45NDVDMjguMjA0NCAxOC43MTEzIDI4LjkyNTQgMTUuMDU3IDI3LjYwMjUgMTEuNDYyOVYxMS40MzZDMjcuNjAyNSAxMS40Mzk1IDI3LjYwMjUgMTEuNDQ0MiAyNy42MDU0IDExLjQ1OTRDMjguMTAyNCAxNC43MTM4IDI2LjQ1MSAxNy44NjY1IDIzLjg2OTIgMTkuOTk4NkMyMy44NjY2IDIwLjAwNDUgMjMuODY0MSAyMC4wMTA2IDIzLjg2MTcgMjAuMDE2N0MxOC44MzA2IDI0LjEyMjMgMTQuMDE2NSAyMi40OTM2IDEzLjA0MTggMjEuODI4OUMxMi45NzQxIDIxLjc5NjIgMTIuOTA1OSAyMS43NjIzIDEyLjgzODIgMjEuNzI3MkM5LjkwNDcgMjAuMzI0MiA4LjY5MzE2IDE3LjY0MzggOC45NTI3MyAxNS4zNDY5QzYuNDc2NTYgMTUuMzQ2OSA1LjYzMTkyIDEzLjI1MjkgNS42MzE5MiAxMy4yNTI5QzUuNjMxOTIgMTMuMjUyOSA3Ljg1NTUyIDExLjY2NCAxMC43ODYxIDEzLjA0NkMxMy41MDAzIDE0LjMyNjIgMTYuMDQ5MyAxMy4yNTM1IDE2LjA0OTMgMTMuMjUyOUMxNi4wNDQxIDEzLjEzODkgMTMuNjA0NyAxMi4xNjYyIDEyLjY1MzMgMTEuMjI2N0MxMi4xNDUyIDEwLjcyNTEgMTEuOTAzNyAxMC40ODMxIDExLjY4OTYgMTAuMzAxM0MxMS41NzM4IDEwLjIwMzEgMTEuNDUyNyAxMC4xMTE0IDExLjMyNjggMTAuMDI2NUMxMS4yNDM0IDkuOTY4MDkgMTEuMTUxOCA5LjkwOTYzIDExLjAzNTIgOS44MzQyMUMxMC4wMTI2IDkuMTY3NzggNy45NzkxOCA5LjIwNDYxIDcuOTEyMSA5LjIwNjM2SDcuOTA1NjhDNy4zNDk3OCA4LjUwMDc2IDcuMzg4ODYgNi4xNzM0OCA3LjQyMDM2IDUuNjg3NjlDNy40MTM5NSA1LjY1NzI5IDcuMDA2MjEgNS44OTk4OSA2Ljk1MzcxIDUuOTM2NzJDNi40NjMxOCA2LjI4NzQzIDYuMDA0NjUgNi42ODEwNCA1LjU4MzUxIDcuMTEyOTNDNS4xMDQyNiA3LjU5OTg4IDQuNjY2NDIgOC4xMjYwOSA0LjI3NDU1IDguNjg2MDdDMy4zNzI5OCA5Ljk2NjU3IDIuNzMzNiAxMS40MTM0IDIuMzkzMzYgMTIuOTQzMUMyLjM4MjI4IDEyLjk3IDEuODgzNTQgMTUuMTUyMyAyLjEyOTcgMTYuMjg0WiIgZmlsbD0idXJsKCNwYWludDdfcmFkaWFsXzg3XzcxMTgpIi8+CjxwYXRoIGQ9Ik0yMC45NjM0IDEwLjczOTlDMjEuNDc1MiAxMS4yNDMxIDIxLjkxMzUgMTEuODE2MiAyMi4yNjUzIDEyLjQ0MjNDMjIuMzM4MyAxMi40OTcxIDIyLjQwODMgMTIuNTU1NyAyMi40NzUzIDEyLjYxNzZDMjUuNjUzMiAxNS41NSAyMy45OTA4IDE5LjcwMTIgMjMuODY0MiAxOS45OTkzQzI2LjQ0NiAxNy44NjczIDI4LjA5NzMgMTQuNzE0NiAyNy42MDAzIDExLjQ2MDFDMjYuMDE1NSA3LjQ5Nzc3IDIzLjMyNzYgNS45MDA2NSAyMS4xMzI1IDIuNDI0MDdDMjEuMDIxMSAyLjI0ODY5IDIwLjkxMDMgMi4wNzMzMSAyMC44MDE4IDEuODg1NjZDMjAuNzQwNiAxLjc3OTg1IDIwLjY5MSAxLjY4Mzk3IDIwLjY0NzggMS41OTMzNkMyMC41NTY5IDEuNDE3NTcgMjAuNDg2NiAxLjIzMTc5IDIwLjQzODQgMS4wMzk3NUMyMC40Mzg4IDEuMDMwNjMgMjAuNDM1OCAxLjAyMTY5IDIwLjQzIDEuMDE0NjdDMjAuNDI0MSAxLjAwNzY1IDIwLjQxNTkgMS4wMDMwNSAyMC40MDY5IDEuMDAxNzVDMjAuMzk4MyAwLjk5OTQxNiAyMC4zODkzIDAuOTk5NDE2IDIwLjM4MDcgMS4wMDE3NUMyMC4zNzgzIDEuMDAyODEgMjAuMzc2MiAxLjAwNDE5IDIwLjM3NDIgMS4wMDU4NEMyMC4zNzA3IDEuMDA1ODQgMjAuMzY3MiAxLjAwOTk0IDIwLjM2MzcgMS4wMTExQzE5LjgyMTMgMS4yNzA2NiAxNi42MDYgNi4zNzMwMSAyMC45NjM0IDEwLjczOTlaIiBmaWxsPSJ1cmwoI3BhaW50OF9yYWRpYWxfODdfNzExOCkiLz4KPHBhdGggZD0iTTIyLjQ3NDMgMTIuNjE0NkMyMi40MDczIDEyLjU1MjYgMjIuMzM3MiAxMi40OTQxIDIyLjI2NDMgMTIuNDM5MkMyMi4yMzU3IDEyLjQxNzYgMjIuMjA2IDEyLjM5NiAyMi4xNzY4IDEyLjM3NDNDMjEuNDI4NCAxMS44NDgyIDIwLjA4OCAxMS4zMjY3IDE4Ljc5NzEgMTEuNTUxOEMyMy44MzkzIDE0LjA3ODQgMjIuNDg1NCAyMi43Nzk1IDE1LjQ5ODUgMjIuNDUxQzE0Ljg3NjQgMjIuNDI2IDE0LjI2MTYgMjIuMzA3OCAxMy42NzQ0IDIyLjEwMDJDMTMuNTM3NCAyMi4wNDg4IDEzLjM5OTcgMjEuOTkyMSAxMy4yNjI2IDIxLjkzMTNDMTMuMTgzMyAyMS44OTUgMTMuMTA0NSAyMS44NTg4IDEzLjAyOTMgMjEuODE4NUwxMy4wMzg2IDIxLjgyNDNDMTQuMDEzMyAyMi40OTA4IDE4LjgyNzQgMjQuMTE5NCAyMy44NTg1IDIwLjAxMjFDMjMuODU4NSAyMC4wMTIxIDIzLjg2MTQgMjAuMDA0NSAyMy44NjYxIDE5Ljk5MzlDMjMuOTkwOSAxOS43MDExIDI1LjY1MzQgMTUuNTQ5OSAyMi40NzQzIDEyLjYxNDZaIiBmaWxsPSJ1cmwoI3BhaW50OV9yYWRpYWxfODdfNzExOCkiLz4KPHBhdGggZD0iTTkuNzI1MzIgMTcuMjIxNUM5LjcyNTMyIDE3LjIyMTUgMTAuMzcyMiAxNC44MDQ4IDE0LjM1ODYgMTQuODA0OEMxNC43ODk3IDE0LjgwNDggMTYuMDIxNiAxMy41OTk0IDE2LjA0NDQgMTMuMjQ5OEMxNi4wNjcxIDEyLjkwMDIgMTMuNDk1MyAxNC4zMjMxIDEwLjc4MTEgMTMuMDQyOEM3Ljg1MDU1IDExLjY2MDggNS42MjY5NSAxMy4yNDk4IDUuNjI2OTUgMTMuMjQ5OEM1LjYyNjk1IDEzLjI0OTggNi40NzE1OSAxNS4zNDM4IDguOTQ3NzYgMTUuMzQzOEM4LjY4ODE5IDE3LjY0MDcgOS44OTk3MyAyMC4zMTg3IDEyLjgzMzIgMjEuNzI0MUMxMi44OTg2IDIxLjc1NSAxMi45NjA0IDIxLjc4OTUgMTMuMDI3NSAyMS44MTk5QzExLjMxNTQgMjAuOTM0OSA5LjkwMjA3IDE5LjI1NzEgOS43MjUzMiAxNy4yMjE1WiIgZmlsbD0idXJsKCNwYWludDEwX3JhZGlhbF84N183MTE4KSIvPgo8cGF0aCBkPSJNMjguOTkwNSAxMC43MjY1QzI4LjM4MTYgOS4yNTc0IDI3LjE0NzMgNy42NzEzOSAyNi4xNzg0IDcuMTcwMzlDMjYuOTY3IDguNzIwMTUgMjcuNDIzMiAxMC4yNzQ2IDI3LjU5NzYgMTEuNDM0NEMyNy41OTc2IDExLjQzNDQgMjcuNTk3NiAxMS40NDI2IDI3LjYwMDUgMTEuNDU3OEMyNi4wMTU2IDcuNDk3NzcgMjMuMzI3NyA1LjkwMDY1IDIxLjEzMjcgMi40MjQwN0MyMS4wMjEzIDIuMjQ4NjkgMjAuOTEwNSAyLjA3MzMxIDIwLjgwMiAxLjg4NTY2QzIwLjc0MDcgMS43Nzk4NSAyMC42OTExIDEuNjgzOTcgMjAuNjQ4IDEuNTkzMzZDMjAuNTU3IDEuNDE3NTcgMjAuNDg2NyAxLjIzMTc5IDIwLjQzODYgMS4wMzk3NUMyMC40MzkgMS4wMzA2MyAyMC40MzU5IDEuMDIxNjkgMjAuNDMwMSAxLjAxNDY3QzIwLjQyNDMgMS4wMDc2NSAyMC40MTYxIDEuMDAzMDUgMjAuNDA3MSAxLjAwMTc1QzIwLjM5ODUgMC45OTk0MTYgMjAuMzg5NCAwLjk5OTQxNiAyMC4zODA4IDEuMDAxNzVDMjAuMzc4NSAxLjAwMjgxIDIwLjM3NjMgMS4wMDQxOSAyMC4zNzQ0IDEuMDA1ODRDMjAuMzcwOSAxLjAwNTg0IDIwLjM2NzQgMS4wMDk5NCAyMC4zNjM5IDEuMDExMUwyMC4zNjk3IDEuMDAzNUMxNi44NDgzIDMuMDcwNjMgMTUuNjUzNiA2Ljg5NDQ2IDE1LjU0NCA4LjgwNzg0QzE1LjcwNzMgOC43OTY3MyAxNS44NzAxIDguNzgyNzEgMTYuMDM2MyA4Ljc4MjcxQzE4LjY2NDEgOC43ODI3MSAyMC45NTMxIDEwLjIzMTMgMjIuMTc4NiAxMi4zNzc0QzIxLjQzMDIgMTEuODUxMiAyMC4wODk4IDExLjMyOTggMTguNzk4OSAxMS41NTQ5QzIzLjg0MSAxNC4wODE1IDIyLjQ4NzIgMjIuNzgyNiAxNS41MDAyIDIyLjQ1NEMxNC44NzgyIDIyLjQyOSAxNC4yNjMzIDIyLjMxMDggMTMuNjc2MiAyMi4xMDMzQzEzLjUzOTEgMjIuMDUxOCAxMy40MDE1IDIxLjk5NTEgMTMuMjY0NCAyMS45MzQzQzEzLjE4NTEgMjEuODk4MSAxMy4xMDYzIDIxLjg2MTggMTMuMDMxMSAyMS44MjE1TDEzLjA0MDQgMjEuODI3M0MxMi45NzI3IDIxLjc5NDYgMTIuOTA0NSAyMS43NjA3IDEyLjgzNjggMjEuNzI1NkMxMi45MDIxIDIxLjc1NjYgMTIuOTY0IDIxLjc5MTEgMTMuMDMxMSAyMS44MjE1QzExLjMxNTUgMjAuOTM0NyA5LjkwMjE2IDE5LjI1NjkgOS43MjU0MiAxNy4yMjEzQzkuNzI1NDIgMTcuMjIxMyAxMC4zNzIzIDE0LjgwNDYgMTQuMzU4NyAxNC44MDQ2QzE0Ljc4OTggMTQuODA0NiAxNi4wMjE3IDEzLjU5OTIgMTYuMDQ0NSAxMy4yNDk2QzE2LjAzOTIgMTMuMTM1NiAxMy41OTk4IDEyLjE2MjggMTIuNjQ4NCAxMS4yMjM0QzEyLjE0MDMgMTAuNzIxOCAxMS44OTg4IDEwLjQ3OTggMTEuNjg0OCAxMC4yOThDMTEuNTY4OSAxMC4xOTk4IDExLjQ0NzggMTAuMTA4MSAxMS4zMjE5IDEwLjAyMzJDMTEuMDAyNiA4LjkwMjcgMTAuOTg5MSA3LjcxNjgzIDExLjI4MjkgNi41ODkzMUM5Ljg0MjY2IDcuMjQ2OTcgOC43MjI3IDguMjg0NjMgNy45MDgzOSA5LjIwMzAzSDcuOTAxOThDNy4zNDYwOCA4LjQ5NzQyIDcuMzg1MTYgNi4xNzAxNSA3LjQxNjY2IDUuNjg0MzVDNy40MTAyNCA1LjY1Mzk1IDcuMDAyNTEgNS44OTY1NiA2Ljk1MDAxIDUuOTMzMzlDNi40NTk0OCA2LjI4NDEgNi4wMDA5NSA2LjY3NzcxIDUuNTc5OCA3LjEwOTZDNS4xMDA1NSA3LjU5NjU1IDQuNjYyNzEgOC4xMjI3NiA0LjI3MDg0IDguNjgyNzRDMy4zNjkyNyA5Ljk2MzIzIDIuNzI5ODkgMTEuNDEwMSAyLjM4OTY1IDEyLjkzOThDMi4zODMyNCAxMi45NzAyIDIuMzc3NCAxMy4wMDE3IDIuMzcwOTkgMTMuMDMyN0MyLjM0NDc0IDEzLjE1NjEgMi4yMjU3NCAxMy43ODM5IDIuMjA5NDEgMTMuOTE4NEMyLjIwOTQxIDEzLjkyODkgMi4yMDk0MSAxMy45MDg0IDIuMjA5NDEgMTMuOTE4NEMyLjEwMDE5IDE0LjU2NzEgMi4wMzAyNiAxNS4yMjE5IDIgMTUuODc5MVYxNS45NTFDMiAyMy43MDk3IDguMjc2NDYgMzAgMTYuMDE4MiAzMEMyMi45NTIxIDMwIDI4LjcwODggMjQuOTU0OSAyOS44MzY0IDE4LjMyOEMyOS44NTk3IDE4LjE0ODUgMjkuODc4OSAxNy45NjczIDI5Ljg5OTkgMTcuNzg2QzMwLjE3ODggMTUuMzc2MyAyOS44NjkgMTIuODQzOSAyOC45OTA1IDEwLjcyNjVaTTI3LjU5OTkgMTEuNDQ3OVYxMS40NjMxVjExLjQ0NzlaIiBmaWxsPSJ1cmwoI3BhaW50MTFfbGluZWFyXzg3XzcxMTgpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfODdfNzExOCIgeDE9IjI3LjEzNSIgeTE9IjUuNDkyNjEiIHgyPSIzLjgxMzkyIiB5Mj0iMjcuOTQzNyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBvZmZzZXQ9IjAuMDUiIHN0b3AtY29sb3I9IiNGRkY0NEYiLz4KPHN0b3Agb2Zmc2V0PSIwLjExIiBzdG9wLWNvbG9yPSIjRkZFODQ3Ii8+CjxzdG9wIG9mZnNldD0iMC4yMiIgc3RvcC1jb2xvcj0iI0ZGQzgzMCIvPgo8c3RvcCBvZmZzZXQ9IjAuMzciIHN0b3AtY29sb3I9IiNGRjk4MEUiLz4KPHN0b3Agb2Zmc2V0PSIwLjQiIHN0b3AtY29sb3I9IiNGRjhCMTYiLz4KPHN0b3Agb2Zmc2V0PSIwLjQ2IiBzdG9wLWNvbG9yPSIjRkY2NzJBIi8+CjxzdG9wIG9mZnNldD0iMC41MyIgc3RvcC1jb2xvcj0iI0ZGMzY0NyIvPgo8c3RvcCBvZmZzZXQ9IjAuNyIgc3RvcC1jb2xvcj0iI0UzMTU4NyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8cmFkaWFsR3JhZGllbnQgaWQ9InBhaW50MV9yYWRpYWxfODdfNzExOCIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgyNi4wNTk2IDQuMjE4NzkpIHNjYWxlKDI5LjIyNDYgMjkuMjg4OCkiPgo8c3RvcCBvZmZzZXQ9IjAuMTMiIHN0b3AtY29sb3I9IiNGRkJENEYiLz4KPHN0b3Agb2Zmc2V0PSIwLjE5IiBzdG9wLWNvbG9yPSIjRkZBQzMxIi8+CjxzdG9wIG9mZnNldD0iMC4yNSIgc3RvcC1jb2xvcj0iI0ZGOUQxNyIvPgo8c3RvcCBvZmZzZXQ9IjAuMjgiIHN0b3AtY29sb3I9IiNGRjk4MEUiLz4KPHN0b3Agb2Zmc2V0PSIwLjQiIHN0b3AtY29sb3I9IiNGRjU2M0IiLz4KPHN0b3Agb2Zmc2V0PSIwLjQ3IiBzdG9wLWNvbG9yPSIjRkYzNzUwIi8+CjxzdG9wIG9mZnNldD0iMC43MSIgc3RvcC1jb2xvcj0iI0Y1MTU2QyIvPgo8c3RvcCBvZmZzZXQ9IjAuNzgiIHN0b3AtY29sb3I9IiNFQjA4NzgiLz4KPHN0b3Agb2Zmc2V0PSIwLjg2IiBzdG9wLWNvbG9yPSIjRTUwMDgwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQyX3JhZGlhbF84N183MTE4IiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDE1LjM4MDkgMTYuMTkyNSkgc2NhbGUoMjkuMjI0NiAyOS4yODg4KSI+CjxzdG9wIG9mZnNldD0iMC4zIiBzdG9wLWNvbG9yPSIjOTYwRTE4Ii8+CjxzdG9wIG9mZnNldD0iMC4zNSIgc3RvcC1jb2xvcj0iI0IxMTkyNyIgc3RvcC1vcGFjaXR5PSIwLjc0Ii8+CjxzdG9wIG9mZnNldD0iMC40MyIgc3RvcC1jb2xvcj0iI0RCMjkzRCIgc3RvcC1vcGFjaXR5PSIwLjM0Ii8+CjxzdG9wIG9mZnNldD0iMC41IiBzdG9wLWNvbG9yPSIjRjUzMzRCIiBzdG9wLW9wYWNpdHk9IjAuMDkiLz4KPHN0b3Agb2Zmc2V0PSIwLjUzIiBzdG9wLWNvbG9yPSIjRkYzNzUwIiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9yYWRpYWxHcmFkaWVudD4KPHJhZGlhbEdyYWRpZW50IGlkPSJwYWludDNfcmFkaWFsXzg3XzcxMTgiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTguOTA0IC0yLjQyODE1KSBzY2FsZSgyMS4xNzIgMjEuMjE4NCkiPgo8c3RvcCBvZmZzZXQ9IjAuMTMiIHN0b3AtY29sb3I9IiNGRkY0NEYiLz4KPHN0b3Agb2Zmc2V0PSIwLjI1IiBzdG9wLWNvbG9yPSIjRkZEQzNFIi8+CjxzdG9wIG9mZnNldD0iMC41MSIgc3RvcC1jb2xvcj0iI0ZGOUQxMiIvPgo8c3RvcCBvZmZzZXQ9IjAuNTMiIHN0b3AtY29sb3I9IiNGRjk4MEUiLz4KPC9yYWRpYWxHcmFkaWVudD4KPHJhZGlhbEdyYWRpZW50IGlkPSJwYWludDRfcmFkaWFsXzg3XzcxMTgiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTIuMTQ4NyAyMy44NDMzKSBzY2FsZSgxMy45MTUgMTMuOTQ1NSkiPgo8c3RvcCBvZmZzZXQ9IjAuMzUiIHN0b3AtY29sb3I9IiMzQThFRTYiLz4KPHN0b3Agb2Zmc2V0PSIwLjQ3IiBzdG9wLWNvbG9yPSIjNUM3OUYwIi8+CjxzdG9wIG9mZnNldD0iMC42NyIgc3RvcC1jb2xvcj0iIzkwNTlGRiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNDMTM5RTYiLz4KPC9yYWRpYWxHcmFkaWVudD4KPHJhZGlhbEdyYWRpZW50IGlkPSJwYWludDVfcmFkaWFsXzg3XzcxMTgiIGN4PSIwIiBjeT0iMCIgcj0iMSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUuODAwNSAxMi43MTE5KSByb3RhdGUoLTEzLjkyNjUpIHNjYWxlKDcuMzczMTYgOC42Nzg1MikiPgo8c3RvcCBvZmZzZXQ9IjAuMjEiIHN0b3AtY29sb3I9IiM5MDU5RkYiIHN0b3Atb3BhY2l0eT0iMCIvPgo8c3RvcCBvZmZzZXQ9IjAuMjgiIHN0b3AtY29sb3I9IiM4QzRGRjMiIHN0b3Atb3BhY2l0eT0iMC4wNiIvPgo8c3RvcCBvZmZzZXQ9IjAuNzUiIHN0b3AtY29sb3I9IiM3NzE2QTgiIHN0b3Atb3BhY2l0eT0iMC40NSIvPgo8c3RvcCBvZmZzZXQ9IjAuOTciIHN0b3AtY29sb3I9IiM2RTAwOEIiIHN0b3Atb3BhY2l0eT0iMC42Ii8+CjwvcmFkaWFsR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQ2X3JhZGlhbF84N183MTE4IiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDE1LjAxMSAzLjAyMDQxKSBzY2FsZSgxMC4wMTA4IDEwLjAzMjgpIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0ZGRTIyNiIvPgo8c3RvcCBvZmZzZXQ9IjAuMTIiIHN0b3AtY29sb3I9IiNGRkRCMjciLz4KPHN0b3Agb2Zmc2V0PSIwLjMiIHN0b3AtY29sb3I9IiNGRkM4MkEiLz4KPHN0b3Agb2Zmc2V0PSIwLjUiIHN0b3AtY29sb3I9IiNGRkE5MzAiLz4KPHN0b3Agb2Zmc2V0PSIwLjczIiBzdG9wLWNvbG9yPSIjRkY3RTM3Ii8+CjxzdG9wIG9mZnNldD0iMC43OSIgc3RvcC1jb2xvcj0iI0ZGNzEzOSIvPgo8L3JhZGlhbEdyYWRpZW50Pgo8cmFkaWFsR3JhZGllbnQgaWQ9InBhaW50N19yYWRpYWxfODdfNzExOCIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgyMi44ODA1IC0zLjM0MzEzKSBzY2FsZSg0Mi43MTA5IDQyLjgwNDYpIj4KPHN0b3Agb2Zmc2V0PSIwLjExIiBzdG9wLWNvbG9yPSIjRkZGNDRGIi8+CjxzdG9wIG9mZnNldD0iMC40NiIgc3RvcC1jb2xvcj0iI0ZGOTgwRSIvPgo8c3RvcCBvZmZzZXQ9IjAuNjIiIHN0b3AtY29sb3I9IiNGRjU2MzQiLz4KPHN0b3Agb2Zmc2V0PSIwLjcyIiBzdG9wLWNvbG9yPSIjRkYzNjQ3Ii8+CjxzdG9wIG9mZnNldD0iMC45IiBzdG9wLWNvbG9yPSIjRTMxNTg3Ii8+CjwvcmFkaWFsR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQ4X3JhZGlhbF84N183MTE4IiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDE4Ljc1MTcgMS4zMzM3NCkgcm90YXRlKDg0LjI0NDcpIHNjYWxlKDMxLjE5OTYgMjAuNDU0MykiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRkZGNDRGIi8+CjxzdG9wIG9mZnNldD0iMC4wNiIgc3RvcC1jb2xvcj0iI0ZGRTg0NyIvPgo8c3RvcCBvZmZzZXQ9IjAuMTciIHN0b3AtY29sb3I9IiNGRkM4MzAiLz4KPHN0b3Agb2Zmc2V0PSIwLjMiIHN0b3AtY29sb3I9IiNGRjk4MEUiLz4KPHN0b3Agb2Zmc2V0PSIwLjM2IiBzdG9wLWNvbG9yPSIjRkY4QjE2Ii8+CjxzdG9wIG9mZnNldD0iMC40NSIgc3RvcC1jb2xvcj0iI0ZGNjcyQSIvPgo8c3RvcCBvZmZzZXQ9IjAuNTciIHN0b3AtY29sb3I9IiNGRjM2NDciLz4KPHN0b3Agb2Zmc2V0PSIwLjc0IiBzdG9wLWNvbG9yPSIjRTMxNTg3Ii8+CjwvcmFkaWFsR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQ5X3JhZGlhbF84N183MTE4IiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDE0Ljc3NTcgNi43MzU5Mykgc2NhbGUoMjYuNjY0NCAyNi43MjMpIj4KPHN0b3Agb2Zmc2V0PSIwLjE0IiBzdG9wLWNvbG9yPSIjRkZGNDRGIi8+CjxzdG9wIG9mZnNldD0iMC40OCIgc3RvcC1jb2xvcj0iI0ZGOTgwRSIvPgo8c3RvcCBvZmZzZXQ9IjAuNTkiIHN0b3AtY29sb3I9IiNGRjU2MzQiLz4KPHN0b3Agb2Zmc2V0PSIwLjY2IiBzdG9wLWNvbG9yPSIjRkYzNjQ3Ii8+CjxzdG9wIG9mZnNldD0iMC45IiBzdG9wLWNvbG9yPSIjRTMxNTg3Ii8+CjwvcmFkaWFsR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQxMF9yYWRpYWxfODdfNzExOCIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgyMS44MTQ1IDguMzAwNTkpIHNjYWxlKDI5LjE4NDQgMjkuMjQ4NCkiPgo8c3RvcCBvZmZzZXQ9IjAuMDkiIHN0b3AtY29sb3I9IiNGRkY0NEYiLz4KPHN0b3Agb2Zmc2V0PSIwLjIzIiBzdG9wLWNvbG9yPSIjRkZFMTQxIi8+CjxzdG9wIG9mZnNldD0iMC41MSIgc3RvcC1jb2xvcj0iI0ZGQUYxRSIvPgo8c3RvcCBvZmZzZXQ9IjAuNjMiIHN0b3AtY29sb3I9IiNGRjk4MEUiLz4KPC9yYWRpYWxHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDExX2xpbmVhcl84N183MTE4IiB4MT0iMjYuODU1IiB5MT0iNS4zNzIxOCIgeDI9IjcuMDEwNDMiIHkyPSIyNS4xNzM5IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMC4xNyIgc3RvcC1jb2xvcj0iI0ZGRjQ0RiIgc3RvcC1vcGFjaXR5PSIwLjgiLz4KPHN0b3Agb2Zmc2V0PSIwLjI3IiBzdG9wLWNvbG9yPSIjRkZGNDRGIiBzdG9wLW9wYWNpdHk9IjAuNjMiLz4KPHN0b3Agb2Zmc2V0PSIwLjQ5IiBzdG9wLWNvbG9yPSIjRkZGNDRGIiBzdG9wLW9wYWNpdHk9IjAuMjIiLz4KPHN0b3Agb2Zmc2V0PSIwLjYiIHN0b3AtY29sb3I9IiNGRkY0NEYiIHN0b3Atb3BhY2l0eT0iMCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='

const safariIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4KICAgIAogICAgPHRpdGxlPlNhZmFyaS1jb2xvcjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPgoKPC9kZWZzPgogICAgPGcgaWQ9Ikljb25zIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iQ29sb3ItIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNzAwLjAwMDAwMCwgLTEwNDMuMDAwMDAwKSI+CiAgICAgICAgICAgIDxnIGlkPSJTYWZhcmkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDcwMC4wMDAwMDAsIDEwNDMuMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsIiBmaWxsPSIjMDBBQkZGIiBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiPgoKPC9jaXJjbGU+CiAgICAgICAgICAgICAgICA8ZyBpZD0iR3JvdXAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI0LjM4ODkwOSwgMjQuMTc2Nzc3KSByb3RhdGUoLTQ1LjAwMDAwMCkgdHJhbnNsYXRlKC0yNC4zODg5MDksIC0yNC4xNzY3NzcpIHRyYW5zbGF0ZSgyLjg4ODkwOSwgMjAuNjc2Nzc3KSI+CiAgICAgICAgICAgICAgICAgICAgPGcgaWQ9Ikdyb3VwLTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDAwMDAwLCAwLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgICAgICAgICA8cG9seWdvbiBpZD0iU2hhcGUiIGZpbGw9IiNGRkZGRkYiIHBvaW50cz0iLTMuMTk3NDQyMzFlLTEzIDMuMSAyMS4zNSA2LjIgMjIuMjkyMTY0NiAwLjczMTE5MjI4MyI+Cgo8L3BvbHlnb24+CiAgICAgICAgICAgICAgICAgICAgICAgIDxwb2x5Z29uIGlkPSJTaGFwZSIgZmlsbD0iI0VFMDAwMCIgcG9pbnRzPSI0Mi43IDMuMSAyMS4zNSA2LjIgMjEuMzUgMi40OTAxMjA0Ij4KCjwvcG9seWdvbj4KICAgICAgICAgICAgICAgICAgICAgICAgPHBvbHlnb24gaWQ9IlNoYXBlIiBmaWxsPSIjRkZGRkZGIiBwb2ludHM9IjAgMy4xIDIxLjM1IDAgMjEuMzUgMy4xIj4KCjwvcG9seWdvbj4KICAgICAgICAgICAgICAgICAgICAgICAgPHBvbHlnb24gaWQ9IlNoYXBlIiBmaWxsPSIjRUUwMDAwIiBwb2ludHM9IjIxLjM1IC0xLjU5ODcyMTE2ZS0xMyA0Mi43IDMuMSAyMS4zNSAzLjEiPgoKPC9wb2x5Z29uPgogICAgICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+'

const STATUS_COLORS: Record<ExtensionConnectionStatus, string> = {
  stopped: 'text-red-400',
  listening: 'text-amber-400',
  connected: 'text-green-500',
  error: 'text-red-400'
}

const STATUS_DOT_COLORS: Record<ExtensionConnectionStatus, string> = {
  stopped: 'bg-red-400',
  listening: 'bg-amber-400',
  connected: 'bg-green-500',
  error: 'bg-red-400'
}

const BROWSER_ICONS: Record<string, string> = {
  chrome: chromeIcon,
  chromium: chromiumIcon,
  brave: braveIcon,
  edge: edgeIcon,
  firefox: firefoxIcon,
  safari: safariIcon
}

const ACTIONS = [
  {
    categoryKey: 'navigation',
    tools: ['ext_navigate', 'ext_back', 'ext_forward', 'ext_reload']
  },
  {
    categoryKey: 'interaction',
    tools: [
      'ext_click',
      'ext_type',
      'ext_select',
      'ext_hover',
      'ext_scroll',
      'ext_focus',
      'ext_keypress',
      'ext_drag_drop',
      'ext_file_upload'
    ]
  },
  {
    categoryKey: 'reading',
    tools: [
      'ext_read_page',
      'ext_query_selector',
      'ext_get_attribute',
      'ext_get_value',
      'ext_get_url',
      'ext_get_page_info'
    ]
  },
  {
    categoryKey: 'tabs',
    tools: [
      'ext_tabs_list',
      'ext_tab_open',
      'ext_tab_close',
      'ext_tab_switch',
      'ext_windows_list',
      'ext_window_open',
      'ext_window_resize'
    ]
  },
  { categoryKey: 'capture', tools: ['ext_screenshot', 'ext_pdf', 'ext_download'] },
  {
    categoryKey: 'data',
    tools: [
      'ext_cookies_get',
      'ext_cookies_set',
      'ext_cookies_remove',
      'ext_storage_get',
      'ext_storage_set',
      'ext_clipboard_read',
      'ext_clipboard_write'
    ]
  },
  {
    categoryKey: 'advanced',
    tools: [
      'ext_execute_js',
      'ext_wait_for',
      'ext_wait_for_navigation',
      'ext_wait_for_network_idle',
      'ext_notify',
      'ext_debugger_attach',
      'ext_debugger_detach',
      'ext_debugger_status',
      'ext_mouse_move',
      'ext_humanize'
    ]
  }
]

/** Where the unpacked extension sits on this machine. */
const EXTENSION_PATH = `${WORKSPACE_ROOT}/../extension`

export function BrowserExtensionPanel(): React.JSX.Element {
  const { t } = useTranslation()
  const { config: workspace, patchConfig } = useDemo()
  const demoAction = useDemoAction()

  const config: BrowserExtensionConfig | null = workspace.browserExtension
  const status: ExtensionServerStatus | null = EXTENSION_STATUS
  const extensionPath = EXTENSION_PATH
  const [portInput, setPortInput] = useState(String(workspace.browserExtension.port))
  const busy = false
  const [copied, setCopied] = useState(false)
  const testing = false
  const testingKey: string | null = null
  const lastTestedKey: string | null = null
  const testResult: 'success' | 'failed' | null = null
  const [debuggerGuideOpen, setDebuggerGuideOpen] = useState(false)
  // The port is the organization's on this machine, so the field only reads.
  const portLocked = orgOwns('browserExtension.port')

  const isConnected = status?.status === 'connected'
  const isListening = status?.status === 'listening'
  const everConnected = isConnected
  const showInstallGuide = !isConnected && !everConnected

  // The desktop keeps a reload-stable list so rows survive an extension
  // reload's few-second reconnect gap; here the connected browsers are the
  // ones the org's bridge reports.
  const displayBrowsers: ExtensionBrowserInfo[] = status?.browsers ?? []

  const handleScreenshotSave = useCallback(
    (patch: { screenshotMaxWidth?: number; screenshotFormat?: 'jpeg' | 'png' }) => {
      patchConfig((c) => ({ ...c, browserExtension: { ...c.browserExtension, ...patch } }))
    },
    [patchConfig]
  )

  const handleCopyPath = useCallback(() => {
    if (!extensionPath || copied) return
    void navigator.clipboard.writeText(extensionPath)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }, [extensionPath, copied])

  const revealKey = navigator.platform.startsWith('Mac')
    ? 'settings.services.browserExtension.revealMac'
    : navigator.platform.startsWith('Win')
      ? 'settings.services.browserExtension.revealWindows'
      : 'settings.services.browserExtension.revealLinux'

  const portDirty = config !== null && portInput !== String(config.port)

  return (
    <div className="flex min-h-full w-full items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-fg text-2xl font-semibold tracking-tight">
            {t('settings.services.browserExtension.title')}
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            {t('settings.services.browserExtension.subtitle')}
          </p>
        </header>

        {/* Extension Folder */}
        {extensionPath && (
          <section className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="text-fg flex min-w-0 items-center gap-2 text-sm font-medium">
                <FolderOpenIcon size={16} className="text-muted shrink-0" />
                {t('settings.services.browserExtension.extensionFolder')}
              </div>
              <button
                type="button"
                onClick={demoAction}
                className="text-primary hover:text-primary/80 shrink-0 cursor-pointer text-sm font-medium"
              >
                {t(revealKey)}
              </button>
            </div>
            <div dir="ltr" className="bg-bg flex w-full items-center gap-2 rounded-lg px-3 py-2">
              <code className="text-muted min-w-0 flex-1 truncate text-xs">{extensionPath}</code>
              <button
                type="button"
                disabled={copied}
                onClick={handleCopyPath}
                className={cn(
                  'shrink-0',
                  copied ? 'text-muted' : 'text-muted hover:text-fg cursor-pointer'
                )}
                aria-label={t('demo.actions.copyPath')}
              >
                {copied ? (
                  <Tick02Icon size={14} />
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <BrowserBadge name="Chromium" supported icon={chromiumIcon} />
              <BrowserBadge name="Chrome" supported icon={chromeIcon} />
              <BrowserBadge name="Brave" supported icon={braveIcon} />
              <BrowserBadge name="Edge" supported icon={edgeIcon} />
              <BrowserBadge name="Safari" supported={false} icon={safariIcon} />
              <BrowserBadge name="Firefox" supported={false} icon={firefoxIcon} />
            </div>
          </section>
        )}

        {/* Connection Status */}
        {status && (
          <section className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-6 max-sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-block h-2.5 w-2.5 rounded-full',
                    STATUS_DOT_COLORS[status.status],
                    status.status === 'listening' && 'animate-pulse'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    STATUS_COLORS[status.status],
                    status.status === 'listening' && 'animate-pulse'
                  )}
                >
                  {t(`settings.services.browserExtension.status.${status.status}`)}
                </span>
                {status.error && <span className="text-muted text-xs">{status.error}</span>}
              </div>
            </div>

            {displayBrowsers.length > 0 && (
              <div className="flex flex-col gap-2">
                {displayBrowsers.map((b) => (
                  <div key={b.id} className="bg-bg flex flex-col gap-2.5 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:gap-x-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- an inline data URI brand mark, not a site asset */}
                      <img
                        src={BROWSER_ICONS[b.browser] ?? chromiumIcon}
                        alt=""
                        className="h-5 w-5 shrink-0"
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-fg truncate text-sm font-medium">
                          {b.name}
                          {b.browserVersion && (
                            <span className="text-muted font-normal">
                              {' '}
                              {b.browserVersion.split('.')[0]}
                            </span>
                          )}
                        </span>
                        <span className="text-muted truncate text-xs">
                          {[
                            b.profileEmail,
                            b.os,
                            `${t('settings.services.browserExtension.status.connected')} ${new Date(
                              b.connectedAt
                            ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                      {displayBrowsers.length > 1 && (
                        <code className="bg-surface text-muted shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]">
                          {b.key}
                        </code>
                      )}
                      {b.version && (
                        <code className="bg-surface text-muted shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]">
                          v{b.version}
                        </code>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ps-8">
                      <button
                        type="button"
                        disabled={busy || testing}
                        onClick={demoAction}
                        className={cn(
                          'text-xs font-medium capitalize',
                          busy || (testing && testingKey !== b.key)
                            ? 'text-muted cursor-not-allowed'
                            : testing && testingKey === b.key
                              ? 'text-muted animate-pulse cursor-wait'
                              : testResult === 'success' && lastTestedKey === b.key
                                ? 'text-green-500'
                                : testResult === 'failed' && lastTestedKey === b.key
                                  ? 'text-red-400'
                                  : 'text-primary hover:text-primary/80 cursor-pointer'
                        )}
                      >
                        {testing && testingKey === b.key
                          ? t('settings.services.browserExtension.testRunning')
                          : testResult === 'success' && lastTestedKey === b.key
                            ? t('settings.services.browserExtension.testPassed')
                            : testResult === 'failed' && lastTestedKey === b.key
                              ? t('settings.services.browserExtension.testFailed')
                              : t('settings.services.browserExtension.testBtn')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center">
              <button
                type="button"
                onClick={demoAction}
                disabled={busy || !isConnected}
                className={cn(
                  'border-border bg-bg/40 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  busy || !isConnected
                    ? 'text-muted/50 cursor-not-allowed'
                    : 'text-fg hover:bg-border/40 cursor-pointer'
                )}
              >
                <RefreshIcon size={12} />
                <span>{t('settings.services.browserExtension.updateBtn')}</span>
              </button>
            </div>
          </section>
        )}

        {/* Port Configuration — the organization owns this path, so the field
            reads only; the notice above the panels says so. */}
        {config && (
          <section className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-6 max-sm:p-4">
            <div className="flex flex-col gap-1">
              <label className="text-fg text-sm font-medium">
                {t('settings.services.browserExtension.portLabel')}
              </label>
              <p className="text-muted text-xs">
                {t('settings.services.browserExtension.portHint')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={65535}
                value={portInput}
                disabled={portLocked}
                title={portLocked ? t('settings.orgManaged.title') : undefined}
                onChange={(e) => setPortInput(e.target.value)}
                className={cn(
                  'border-border bg-bg text-fg h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm font-mono',
                  'focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none',
                  portLocked && 'cursor-not-allowed opacity-60'
                )}
              />
              <Button onClick={demoAction} disabled={!config || busy || portLocked || !portDirty}>
                {t('settings.services.browserExtension.savePort')}
              </Button>
            </div>
          </section>
        )}

        {/* Screenshot Settings */}
        {config && (
          <section className="bg-surface border-border flex flex-col gap-5 rounded-2xl border p-6 max-sm:p-4">
            <div className="flex flex-col gap-2">
              <label className="text-fg text-sm font-medium">
                {t('settings.services.browserExtension.resolutionLabel')}
              </label>
              <p className="text-muted text-xs">
                {t('settings.services.browserExtension.resolutionHint')}
              </p>
              <div className="flex flex-wrap gap-2">
                {[640, 960, 1280, 1920].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleScreenshotSave({ screenshotMaxWidth: w })}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm cursor-pointer',
                      config.screenshotMaxWidth === w
                        ? 'bg-primary text-primary-fg border-primary'
                        : 'border-border text-muted hover:bg-border/40 hover:text-fg'
                    )}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-fg text-sm font-medium">
                {t('settings.services.browserExtension.formatLabel')}
              </label>
              <p className="text-muted text-xs">
                {t('settings.services.browserExtension.formatHint')}
              </p>
              <div className="flex gap-2">
                {(['jpeg', 'png'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleScreenshotSave({ screenshotFormat: fmt })}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm cursor-pointer uppercase',
                      config.screenshotFormat === fmt
                        ? 'bg-primary text-primary-fg border-primary'
                        : 'border-border text-muted hover:bg-border/40 hover:text-fg'
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Installation Guide (shown when never connected this session) */}
        {showInstallGuide && (
          <section className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-6 max-sm:p-4">
            <h2 className="text-fg text-sm font-semibold">
              {t('settings.services.browserExtension.installTitle')}
            </h2>
            <ol className="text-muted flex flex-col gap-3 text-sm leading-relaxed">
              {[1, 2, 3, 4].map((step) => (
                <li key={step} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      'bg-primary/15 text-primary'
                    )}
                  >
                    {step}
                  </span>
                  <span>
                    {t(`settings.services.browserExtension.step${step}`)}
                    {step === 1 && (
                      <button
                        type="button"
                        onClick={demoAction}
                        className="text-primary hover:text-primary/80 cursor-pointer underline"
                      >
                        {t('settings.services.browserExtension.step1Link')}
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            {isListening && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500 animate-pulse" />
                <p className="text-green-500 text-xs animate-pulse">
                  {t('settings.services.browserExtension.waitingForConnection')}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Debugger Mode Guide */}
        <section className="bg-surface border-border flex flex-col rounded-2xl border">
          <button
            type="button"
            onClick={() => setDebuggerGuideOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between p-5 max-sm:p-4"
          >
            <h2 className="text-fg text-sm font-semibold">
              {t('settings.services.browserExtension.debuggerMode.title')}
            </h2>
            <ArrowDown01Icon
              size={16}
              className={cn(
                'text-muted shrink-0 transition-transform duration-200',
                debuggerGuideOpen && 'rotate-180'
              )}
            />
          </button>
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-200 ease-out',
              debuggerGuideOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-4 px-5 pb-5 pt-0 max-sm:px-4 max-sm:pb-4">
                <p className="text-muted text-sm leading-relaxed">
                  {t('settings.services.browserExtension.debuggerMode.body')}
                </p>
                <div className="bg-bg rounded-lg p-4">
                  <p className="text-muted text-xs leading-relaxed">
                    {t('settings.services.browserExtension.debuggerMode.infobarNote')}
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">
                        macOS
                      </span>
                      <code className="text-fg bg-surface rounded px-2 py-1 text-[11px] font-mono break-all">
                        open -a &quot;Google Chrome&quot; --args --silent-debugger-extension-api
                      </code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">
                        Windows
                      </span>
                      <code className="text-fg bg-surface rounded px-2 py-1 text-[11px] font-mono break-all">
                        &quot;C:\Program Files\Google\Chrome\Application\chrome.exe&quot;
                        --silent-debugger-extension-api
                      </code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">
                        Linux
                      </span>
                      <code className="text-fg bg-surface rounded px-2 py-1 text-[11px] font-mono break-all">
                        google-chrome --silent-debugger-extension-api
                      </code>
                    </div>
                  </div>
                </div>
                <p className="text-muted text-xs leading-relaxed">
                  <span className="font-semibold">
                    {t('settings.services.browserExtension.debuggerMode.tipLabel')}
                  </span>{' '}
                  {t('settings.services.browserExtension.debuggerMode.tipText')}
                </p>
                <p className="text-muted text-xs leading-relaxed">
                  <span className="font-semibold">
                    {t('settings.services.browserExtension.debuggerMode.notSupportedLabel')}
                  </span>{' '}
                  {t('settings.services.browserExtension.debuggerMode.notSupportedText')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Actions Table */}
        <section className="bg-surface border-border flex flex-col rounded-2xl border">
          <div className="p-5 pb-3 max-sm:px-4 max-sm:pt-4">
            <h2 className="text-fg text-sm font-semibold">
              {t('settings.services.browserExtension.actionsTitle')}
            </h2>
            <p className="text-muted mt-1 text-xs">
              {t('settings.services.browserExtension.actionsSubtitle')}
            </p>
          </div>
          {ACTIONS.map((group, gi) => (
            <div key={group.categoryKey}>
              <div className="border-border/60 border-t" />
              <div className="px-5 pt-3 pb-1 max-sm:px-4">
                <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">
                  {t(`settings.services.browserExtension.actions.${group.categoryKey}.category`)}
                </span>
              </div>
              {group.tools.map((tool, ai) => (
                <div
                  key={tool}
                  className={cn(
                    'flex items-center gap-3 px-5 py-2 max-sm:px-4',
                    gi === ACTIONS.length - 1 && ai === group.tools.length - 1 && 'pb-4'
                  )}
                >
                  <code className="text-fg bg-bg shrink-0 rounded px-1.5 py-0.5 text-[11px] font-mono">
                    {tool}
                  </code>
                  <span className="text-muted min-w-0 truncate text-xs">
                    {t(`settings.services.browserExtension.actions.${tool}`)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

function BrowserBadge({
  name,
  supported,
  icon
}: {
  name: string
  supported: boolean
  icon: string
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <Tooltip
      content={
        supported
          ? t('settings.services.browserExtension.supported')
          : t('settings.services.browserExtension.notSupported')
      }
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ring-1 cursor-default select-none',
          supported
            ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400'
            : 'bg-border/30 text-muted ring-border/50 line-through opacity-50'
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- an inline data URI brand mark, not a site asset */}
        <img src={icon} alt={name} className={cn('h-3.5 w-3.5', !supported && 'grayscale')} />
        {name}
      </span>
    </Tooltip>
  )
}
