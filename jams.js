JAMS = {
  stringify: x => Array.isArray(x) ? (
    `[${[...x].map(JAMS.stringify).join(" ")}]`
  ) : typeof x == "object" && x != null ? `{${Object.entries(x).map(
    ([k, v]) => `${JAMS.stringify(k)} ${JAMS.stringify(v)}`
  ).join(" ")}}` : typeof x == "string" ? (hush => (
    hush(() => JAMS.parse(x)) == x ? x : JSON.stringify(x)
  ))(f => { try { return f() } catch (_) {} }) : (() => {
    throw new Error(`Found non-string value (${x}); use JAMS.normalize`)
  })(), normalize: x => JSON.parse(JSON.stringify(x), (k, v) => (
    typeof v == "object" && v ? v : String(v)
  )), parse: text => {
    let make = (x, f) => (f(x), x), same = x => x, i = 0
    let when = (x, f, g) => x != null ? f(x) : g && g()
    let take = x => (x.lastIndex = i, when(
      x.exec(text), y => (i = x.lastIndex, y[0])
    )), need = (x, y=`\`${x.source}'`) => when(take(x), same, () => {
      throw new Error(`Expected ${y}, found ${i < text.length ? "\`" + (
        JSON.stringify(text[i]).replace(/^"|"$/g, "")
      ) + "'" : "eof"} (${spot()})`)
    }), read = () => (need(/^|(?<=[\[\{])|\s+/y, `space`), (
      take(/"/y) ? JSON.parse(`"${make(need(
        /([^"\r\n\\]|\\([bfnrt\\"]|u[0-9a-fA-F]{4}))*/yu
      ), () => need(/"/y))}"`) : take(/\[/y) ? make([], xs => {
        while (!take(/\s*\]/y)) xs.push(read())
      }) : take(/\{/y) ? make({}, x => {
        while (!take(/\s*\}/y)) {
          let [k, i0, v] = [read(), i, read()]
          if (k in x) throw new Error(`Duplicate key \`${k}' (${
            i = i0 - k.length, spot()
          })`); x[k] = v
        }
      }) : need(/[^\s\[\]{}"\\]+/yu, `value`)
    )), spot = () => (x => `${x.split("\n").length}:${
      x.replace(/^[.\n]*\n/, "").length + 1
    }`)(text.substr(0, i))
    return make(read(), () => take(/\s*/y), need(/$/y, `eof`))
  }
}
