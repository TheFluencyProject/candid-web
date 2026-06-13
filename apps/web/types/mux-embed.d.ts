// mux-embed 5.18.1 ships a .d.ts but no `types` export condition, so `moduleResolution: bundler`
// can't resolve it. `any` is fine for this analytics glue; drop this if the package adds a types export.
declare module "mux-embed";
