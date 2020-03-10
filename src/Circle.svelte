<script>
  import { css, keyframes } from "emotion";
  export let size;
  export let color;

  const rotate = keyframes`
  0% {transform: rotate(0)}
  100% {transform: rotate(360deg)}
`;

  export const circle = css`
    height: ${size}px;
    width: ${size}px;
    border-color: ${color} transparent ${color} ${color};
    border-width: ${size/15}px;
    border-style: solid;
    border-image: initial;
    border-radius: 50%;
  `;
</script>

<div
  class="{circle}"
  style="animation: 0.75s linear 0s infinite normal none running {rotate}"
/>
