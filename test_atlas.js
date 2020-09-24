const builder = require("../builder");
const { run } = builder;
const { atlas, clean } = builder.tasks;

clean.tree("build");

const r = run([
  atlas({
    files: "src/features/*/spritesheets/*/",
    destination: "build/{{prefix}}features/{{feature}}/images/",
    mobileScaleMode: "bezier",
    mobileScale: 0.5,
    sizeLimit: 2048,
    crop: true,
    // jsonCallback: (function (json) {
    //   return JSON.stringify(json, null, atlas.compress ? 0 : 4)
    //     .replace(
    //       /"\.?\/?src\/features\/([_a-zA-Z0-9\-]+)\/(images|spritesheets)\/(default(\.atlas)?\/)?/g,
    //       '"$1/'
    //     )
    //     .replace(/\.atlas\//g, "/");
    // }),
  }),
]);
