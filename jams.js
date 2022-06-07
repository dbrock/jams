JAMS = {}

JAMS.stringify = x => {
  if (Array.isArray(x)) {
    return `[${[...x].map(JAMS.stringify).join(" ")}]`
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
    return `{${Object.entries(x).map(
      ([k, v]) => `${JAMS.stringify(k)} ${JAMS.stringify(v)}`
    ).join(" ")}}`
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
        `found \`${input[i]}'`,
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
    expect(/^|(?<=[\[\{])|\s+/y, `next expression`)

    if (accept(/"/y)) {
      let x = accept(/([^"\r\n\\]|\\([bfnrt\\"]|u[0-9a-fA-F]{4}))*/y)
      expect(/"/y)
      return JSON.parse(`"${x}"`)
    } else if (accept(/\[/y)) {
      let result = []
      while (!accept(/\s*\]/y)) result.push(parse())
      return result
    } else if (accept(/\{/y)) {
      let result = {}
      while (!accept(/\s*\}/y)) {
        let [k, v] = [parse(), parse()]
        if (k in result) throw new Error(
          `Duplicate key: \`${k}' (${location()})`
        )
        result[k] = v
      }
      return result
    } else {
      return expect(/[^\s\[\]{}"\\]+/y, `expression`)
    }
  }

  let result = parse()
  expect(/\s*$/y, `end of file`)
  return result
}
