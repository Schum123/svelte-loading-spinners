<script>
  import { css, keyframes } from "emotion";
  export let size = 60;
  export let color = "#FF3E00";
  export let duration = "1.0s";
  export let unit = 'px'

  const scaleOut = keyframes`
    0% {transform: scale(0);}
    100% {transform: scale(1);opacity: 0;}
  `;
  const wrapper = css`
    width: ${size+unit};
    height: ${size+unit};
  `;
  const circle = css`
    width: ${size+unit};
    height: ${size+unit};
    background-color: ${color};
    animation-duration: ${duration};
    border-radius: 100%;
    display: inline-block;
    animation: ${scaleOut} 1s ease-in-out infinite;`
</script>
<div class="{wrapper}" >
  <div class="{circle}" />
</div>
