// Заголовок коммита: `префикс-ветки: Заголовок`. type - первый сегмент префикса
// (feature, hotfix, infra или номер задачи), scope - остаток (`feature/BE-10` → BE-10).
const parserOpts = {
  headerPattern: /^([^/:]+)(?:\/([^:]+))?: (.+)$/,
  headerCorrespondence: ["type", "scope", "subject"],
  noteKeywords: ["[!!]"],
};

const ticketType = "+([A-Z])-[0-9]*";

const sectionByType = {
  feature: "Features",
  hotfix: "Bug Fixes",
  fix: "Bug Fixes",
};

const toSection = (type) =>
  sectionByType[type] ?? (/^[A-Z]+-\d/.test(type) ? "Bug Fixes" : undefined);

export default {
  branches: ["main"],
  tagFormat: "v${version}",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        parserOpts,
        releaseRules: [
          { breaking: true, release: "major" },
          { type: "feature", release: "minor" },
          { type: "hotfix", release: "patch" },
          { type: "fix", release: "patch" },
          { type: ticketType, release: "patch" },
          { type: "infra", release: false },
          { type: "chore", release: false },
          { type: "docs", release: false },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        parserOpts,
        writerOpts: {
          // Без релиз-значимых типов коммит в заметки не попадает (кроме breaking).
          transform: (commit) => {
            const breaking = commit.notes.length > 0;
            const section =
              toSection(commit.type) ?? (breaking ? "Other" : undefined);
            if (!section) return undefined;
            return {
              ...commit,
              type: section,
              shortHash: commit.hash?.slice(0, 7),
              notes: commit.notes.map((note) => ({
                ...note,
                title: "BREAKING CHANGES",
              })),
            };
          },
        },
      },
    ],
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md"],
        message:
          "release: v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    "@semantic-release/github",
  ],
};
