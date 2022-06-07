JAMS = {}

JAMS.normalize = x => JSON.parse(JSON.stringify(x), (k, v) => (
  typeof v == "object" && v ? v : String(v)
))

JAMS.stringify = x => {
  if (Array.isArray(x)) {
    return `[${[...x].map(JAMS.stringify).join(" ")}]`
  } else if (typeof x == "object" && x != null) {
    return `{${Object.entries(x).map(
      ([k, v]) => `${JAMS.stringify(k)} ${JAMS.stringify(v)}`
    ).join(" ")}}`
  } else if (typeof x == "string") {
    try {
      if (JAMS.parse(x) == x) {
        return x
      } else {
        throw null
      }
    } catch {
      return JSON.stringify(x)
    }
  } else {
    throw new Error(`Found non-string value (${x}); use JAMS.normalize`)
  }
}

JAMS.parse = input => {
  let i = 0, location = () => (x => `line ${
    x.split("\n").length
  }, column ${
    x.replace(/^[.\n]*\n/, "").length + 1
  }`)(input.substr(0, i))

  let expect = (x, y) => {
    let result = accept(x)
    if (result == null) {
     throw new Error([
        `Expected ${y || `/${x.source}/`},`,
        `found \`${JSON.stringify(input[i]).replace(/^"|"$/g, "")}'`,
        `(${location()})`,
      ].join(" "))
    } else {
      return result
    }
  }

  let accept = x => {
    x.lastIndex = i
    let result = x.exec(input)
    if (result) {
      i = x.lastIndex
      return result[0]
    }
  }

  let parse = () => {
    expect(/^|(?<=[\[\{])|\s+/y, `whitespace`)

    if (accept(/"/y)) {
      let x = expect(/([^"\r\n\\]|\\([bfnrt\\"]|u[0-9a-fA-F]{4}))*/yu)
      expect(/"/y, `end quote`)
      return JSON.parse(`"${x}"`)
    } else if (accept(/\[/y)) {
      let result = []
      while (!accept(/\s*\]/y)) result.push(parse())
      return result
    } else if (accept(/\{/y)) {
      let result = {}
      while (!accept(/\s*\}/y)) {
        let k = parse()
        if (k in result) throw new Error(
          `Duplicate key \`${k}' (${i -= k.length, location()})`
        )
        result[k] = parse()
      }
      return result
    } else {
      return expect(/[^\s\[\]{}"\\]+/yu, `expression`)
    }
  }

  let result = parse()
  accept(/\s*/y), expect(/$/y, `end of file`)
  return result
}
