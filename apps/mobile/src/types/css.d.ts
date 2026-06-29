// Type declarations for CSS imports used by the Expo template (NativeWind /
// global styles). Lets `tsc --noEmit` resolve these side-effect and module imports.
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
