<script>
  export let size;
  export let color;
  $: styles = [`width: ${size}px`, `height: ${size}px`].join(";");
  $: circles = [`background-color: ${color}`];
</script>

<div style="{styles}" class="spinner spinner--jumper">
  <div style="{circles}"></div>
  <div style="{circles}"></div>
  <div style="{circles}"></div>
</div>

<style>
  .spinner {
  }
  * {
    line-height: 0;
    box-sizing: border-box;
  }
  .spinner > div {
    border-radius: 100%;
    animation-fill-mode: both;
    position: absolute;
    opacity: 0;
    width: 50px;
    height: 50px;
    animation: jumper 1s 0s linear infinite;
  }
  .spinner > div:nth-child(2) {
    animation-delay: 0.33333s;
  }
  .spinner > div:nth-child(3) {
    animation-delay: 0.66666s;
  }
  @keyframes jumper {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    5% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
