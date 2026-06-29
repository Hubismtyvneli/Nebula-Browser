import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300; // cache for 5 minutes

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

// CONFIG: Change this to your GitHub repo when you create it
// For now it points to a placeholder — update this after `git push`
const GITHUB_REPO = "nebula-browser/nebula-browser";

/**
 * GET /api/updates/check?current=0.3.0
 *
 * Checks GitHub Releases for a newer version than `current`.
 * Returns { hasUpdate, latestVersion, releaseNotes, downloadUrl, publishedAt }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const currentVersion = url.searchParams.get("current") || "0.0.0";

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Nebula-Browser-Update-Checker",
      },
      // Cache the response on the server side for 5 min to avoid rate limits
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      // GitHub returns 404 if no releases exist yet
      if (res.status === 404) {
        return NextResponse.json({
          hasUpdate: false,
          latestVersion: currentVersion,
          message: "No releases published yet",
        });
      }
      return NextResponse.json(
        { hasUpdate: false, error: `GitHub API returned ${res.status}` },
        { status: 200 }
      );
    }

    const release: GitHubRelease = await res.json();
    const latestVersion = (release.tag_name || "").replace(/^v/, "");

    // Compare versions semantically
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    return NextResponse.json({
      hasUpdate,
      latestVersion,
      currentVersion,
      releaseName: release.name,
      releaseNotes: release.body,
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
      assets: release.assets.map((a) => ({
        name: a.name,
        url: a.browser_download_url,
        size: a.size,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { hasUpdate: false, error: message },
      { status: 200 }
    );
  }
}

/**
 * Compare two semver strings.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
function compareVersions(a: string, b: string): number {
  const parseVer = (v: string) =>
    v
      .split(".")
      .map((n) => parseInt(n.replace(/\D/g, "") || "0", 10));
  const [aMajor = 0, aMinor = 0, aPatch = 0] = parseVer(a);
  const [bMajor = 0, bMinor = 0, bPatch = 0] = parseVer(b);
  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}
