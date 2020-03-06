<script>
  export let size = "40px";
  export let background = "#ff3e00";
  export let duration = "1.2s";
  $: rectStyles = [
    `background-color: ${background}`,
    `animation-duration: ${duration}`
  ].join(";");
  $: styles = [`width: ${size}`, `height: ${size}`].join(";");
</script>

<div style="{styles}" class="spinner spinner--stretch">
  <div style="{rectStyles}" class="rect rect-1"></div>
  <div style="{rectStyles}" class="rect rect-2"></div>
  <div style="{rectStyles}" class="rect rect-3"></div>
  <div style="{rectStyles}" class="rect rect-4"></div>
  <div style="{rectStyles}" class="rect rect-5"></div>
</div>

<style>
  .spinner {
    display: inline-block;
    text-align: center;
    font-size: 10px;
  }
  * {
    line-height: 0;
    box-sizing: border-box;
  }
  .rect {
    animation: sk-stretchdelay 1.2s ease-in-out infinite;
  }
  .spinner > div {
    height: 100%;
    width: 10%;
    display: inline-block;
  }
  .spinner .rect-2 {
    animation-delay: -1.1s;
  }
  .spinner .rect-3 {
    animation-delay: -1s;
  }
  .spinner .rect-4 {
    animation-delay: -0.9s;
  }
  .spinner .rect-5 {
    animation-delay: -0.8s;
  }
  @keyframes sk-stretchdelay {
    0%,
    40%,
    100% {
      transform: scaleY(0.4);
    }
    20% {
      transform: scaleY(1);
    }
  }
</style>
