declare module "react-apexcharts" {
  import { Component } from "react";
  interface Props {
    type?: "line" | "area" | "bar" | "histogram" | "pie" | "donut" | "radialBar" | "scatter" | "bubble" | "heatmap" | "treemap" | "boxPlot" | "candlestick" | "radar" | "polarArea" | "rangeBar";
    series?: any[];
    options?: any;
    width?: string | number;
    height?: string | number;
    [key: string]: any;
  }
  export default class Chart extends Component<Props> {}
}