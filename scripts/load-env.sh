# shellcheck shell=bash
# Safe .env loader for deploy scripts (supports spaces and quoted values).
load_env_file() {
  local file="$1"
  local line key val
  [[ -f "${file}" ]] || {
    echo "Env file not found: ${file}" >&2
    return 1
  }
  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line%%$'\r'}"
    [[ -z "${line//[[:space:]]}" || "${line}" =~ ^[[:space:]]*# ]] && continue
    [[ "${line}" == *"="* ]] || continue
    key="${line%%=*}"
    val="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    if [[ "${val}" =~ ^\".*\"$ ]]; then
      val="${val:1:${#val}-2}"
    elif [[ "${val}" =~ ^\'.*\'$ ]]; then
      val="${val:1:${#val}-2}"
    fi
    export "${key}=${val}"
  done < "${file}"
}
