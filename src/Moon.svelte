<script>
  export let size = 60;
  export let color = "#FF3E00";
  export let unit = "px";
  let moonSize = size / 7;
  let top = size / 2 - moonSize / 2;
</script>

<style>
  .wrapper {
    height: var(--size);
    width: var(--size);
    border-radius: 100%;
    animation: moonStretchDelay 0.6s 0s infinite linear;
    animation-fill-mode: forwards;
    position: relative;
  }
  .circle-one {
    top: var(--moonSize);
    background-color: var(--color);
    width: calc(var(--size) / 7);
    height: calc(var(--size) / 7);
    border-radius: 100%;
    animation: moonStretchDelay 0.6s 0s infinite linear;
    animation-fill-mode: forwards;
    opacity: 0.8;
    position: absolute;
  }
  .circle-two {
    opacity: 0.1;
    border: calc(var(--size) / 7) solid var(--color);
    height: var(--size);
    width: var(--size);
    border-radius: 100%;
    box-sizing: border-box;
  }
  @keyframes moonStretchDelay {
    100% {
      transform: rotate(360deg);
    }
  }
</style>

<div
  class="wrapper"
  style="--size: {size}{unit}; --color: {color}; --moonSize: {top}{unit}"
>
  <div class="circle-one"></div>
  <div class="circle-two"></div>
</div>
