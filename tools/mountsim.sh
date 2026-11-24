#!/bin/bash
# mountsim.sh — real grader simulation: tmpfs as /output, repo bind-mounted
# read-only, unprivileged uid 65534, no network (own net namespace),
# foreign cwd, grader env. Runs node main.ts twice; dossier must be byte-identical.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
OUT="$TMP/output"
mkdir -p "$OUT" "$TMP/ro"
chmod 755 "$TMP" "$OUT" "$TMP/ro"
cleanup() { umount "$TMP/ro" 2>/dev/null || true; umount "$OUT" 2>/dev/null || true; rm -rf "$TMP"; }
trap cleanup EXIT
echo "repo: $REPO"
chmod -R a+rX "$REPO" # grader's /bot is world-readable; repo files are 660/770 here
mount -t tmpfs -o mode=0777 tmpfs "$OUT"
mount --bind "$REPO" "$TMP/ro"
chmod 755 "$TMP/ro" # bind mount shares the repo dir's mode; make it world-traversable
mount -o remount,ro,bind "$TMP/ro"
run_once() {
  unshare -n bash -c "
    cd /
    env -i PATH=/usr/local/bin:/usr/bin:/bin TZ=UTC PYTHONHASHSEED=0 LANG=C.UTF-8 MAKEFUN_OUTPUT_DIR='$OUT' HOME=/tmp \
      setpriv --reuid=65534 --regid=65534 --clear-groups node '$TMP/ro/main.ts'
  "
}
run_once
sha256sum "$OUT/dossier.json" | tee "$TMP/hash1.txt"
run_once
sha256sum "$OUT/dossier.json" | tee "$TMP/hash2.txt"
if cmp -s "$TMP/hash1.txt" "$TMP/hash2.txt"; then echo 'MOUNTSIM: DOSSIER BYTE-IDENTICAL'; else echo 'MOUNTSIM: DOSSIER DIFFERS'; exit 1; fi
ls "$OUT"
