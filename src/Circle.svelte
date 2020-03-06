<script>
  export let size = "40px";
  $: styles = [`width: ${size}`, `height: ${size}`].join(";");
</script>

<svg
  style="{styles}"
  class="spinner spinner--circle"
  viewBox="0 0 66 66"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle
    class="path"
    fill="none"
    stroke-width="6"
    stroke-linecap="round"
    cx="33"
    cy="33"
    r="30"
  ></circle>
</svg>
<style>
  svg {
    --offset: 187;
    --duration: 1.4s;
  }
  .spinner {
    animation: circle-rotator var(--duration) linear infinite;
  }
  .spinner * {
    line-height: 0;
    box-sizing: border-box;
  }
  @keyframes circle-rotator {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(270deg);
    }
  }
  .path {
    stroke-dasharray: var(--offset);
    stroke-dashoffset: 0;
    transform-origin: center;
    animation: circle-dash var(--duration) ease-in-out infinite,
      circle-colors calc(var(--duration) * 4) ease-in-out infinite;
  }
  @keyframes circle-colors {
    0% {
      stroke: #676778;
    }
    25% {
      stroke: #ff3e00;
    }
    50% {
      stroke: #f7c223;
    }
    75% {
      stroke: #41b883;
    }
    100% {
      stroke: #40b3ff;
    }
  }
  @keyframes circle-dash {
    0% {
      stroke-dashoffset: var(--offset);
    }
    50% {
      stroke-dashoffset: calc(var(--offset) / 4);
      transform: rotate(135deg);
    }
    100% {
      stroke-dashoffset: var(--offset);
      transform: rotate(450deg);
    }
  }
</style>
