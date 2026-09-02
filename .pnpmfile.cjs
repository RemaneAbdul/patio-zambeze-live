const securityOverrides = {
  "body-parser": "1.20.6",
  dompurify: "3.4.13",
  lodash: "4.18.0",
  "lodash-es": "4.18.0",
  "mdast-util-to-hast": "13.2.1",
  mermaid: "11.16.1",
  "path-to-regexp": "0.1.13",
  qs: "6.16.0",
  uuid: "11.1.1",
};

function readPackage(pkg) {
  for (const field of ["dependencies", "optionalDependencies", "devDependencies", "peerDependencies"]) {
    const section = pkg[field];
    if (!section) continue;
    for (const [name, version] of Object.entries(securityOverrides)) {
      if (name in section) section[name] = version;
    }
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
