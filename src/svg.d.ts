// SVG icons are bundled as text (angular.json -> "loader": { ".svg": "text" }) and inlined by
// the Icon component, so they can use `currentColor`.
declare module '*.svg' {
  const markup: string;
  export default markup;
}
