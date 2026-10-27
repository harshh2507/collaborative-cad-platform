

declare module "*.jsx" {
  const Component: (props: any) => import("react").JSX.Element;
  export default Component;
}

