<script>
  import { css, keyframes } from "emotion";
  export let size = 60;
  export let color = '#FF3E00';
  export let unit = "px"

  const rotate = keyframes`
  0% {transform: rotate(0)}
  100% {transform: rotate(360deg)}
`;

  export const circle = css`
    height: ${size+unit};
    width: ${size+unit};
    border-color: ${color} transparent ${color} ${color};
    border-width: ${size/15+unit};
    border-style: solid;
    border-image: initial;
    border-radius: 50%;
  `;
</script>

<div
  class="{circle}"
  style="animation: 0.75s linear 0s infinite normal none running {rotate}"
/>
