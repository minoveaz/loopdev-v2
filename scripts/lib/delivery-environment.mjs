import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

export function deliveryEnvironment(root) {
  const gitDirectory = resolve(root, git(root, ["rev-parse", "--git-dir"]));
  const commonDirectory = resolve(root, git(root, ["rev-parse", "--git-common-dir"]));
  const branch = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  const upstream = git(root, ["for-each-ref", "--format=%(upstream:short)", `refs/heads/${branch}`]) || null;
  return {
    repository_path: root,
    checkout_type: gitDirectory === commonDirectory ? "branch" : "worktree",
    branch,
    base_branch: upstream,
    base_branch_source: upstream ? "git-upstream" : "unavailable",
    head_commit: git(root, ["rev-parse", "HEAD"]),
    working_tree: git(root, ["status", "--porcelain"]) ? "modified" : "clean",
    runtime_url: null,
    runtime_port: null,
  };
}
