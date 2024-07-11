declare module "*.svg" {
  import { PropsForElement } from "@ncpa0cpl/vanilla-jsx/dist/types/jsx-namespace/prop-types/shared/props-for-element";
  const Svg: (props: PropsForElement<SVGElement>) => SVGElement;
  type SvgType = typeof Svg;
  export type { SvgType as Svg };
  export default Svg;
}
