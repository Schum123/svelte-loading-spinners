<script>
  import { css, keyframes } from "emotion";
  export let size;
  export let color;
  export let duration = "1.0s";

  const scaleOut = keyframes`
    0% {transform: scale(0);}
    100% {transform: scale(1);opacity: 0;}
  `;
  const wrapper = css`
    width: ${size}px;
    height: ${size}px;
  `;
  const circle = css`
    width: ${size}px;
    height: ${size}px;
    background-color: ${color};
    animation-duration: ${duration};
    border-radius: 100%;
    display: inline-block;
    animation: ${scaleOut} 1s ease-in-out infinite;`
</script>
<div class="{wrapper}" >
  <div class="{circle}" />
</div>
