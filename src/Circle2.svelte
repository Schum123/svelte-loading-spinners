<script>
  import { css, keyframes } from "emotion";
  export let size = 60;
  export let unit = "px";
  export let colorOuter = "#FF3E00";
  export let colorCenter = "#40B3FF";
  export let colorInner = "#676778";

  const circleSpin = keyframes`
  0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  `;
  const circle = css`
    width: ${size + unit};
    height: ${size + unit};
    box-sizing: border-box;
    position: relative;
    border: 3px solid transparent;
    border-top-color: ${colorOuter};
    border-radius: 50%;
    animation: ${circleSpin} 2s linear infinite;
    :before,
    :after {
      content: "";
      box-sizing: border-box;
      position: absolute;
      border: 3px solid transparent;
      border-radius: 50%;
    }
    &:after {
      border-top-color: ${colorInner};
      top: 9px;
      left: 9px;
      right: 9px;
      bottom: 9px;
      animation: ${circleSpin} 1.5s linear infinite;
    }
    :before {
      border-top-color: ${colorCenter};
      top: 3px;
      left: 3px;
      right: 3px;
      bottom: 3px;
      animation: ${circleSpin} 3s linear infinite;
    }
  `;
</script>

<div class="{circle} {$$props.class}"></div>
