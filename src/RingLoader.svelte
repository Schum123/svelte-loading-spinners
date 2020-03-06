<script>
  export let size;
  export let color;
  $: styles = [`width: ${size}px`, `height: ${size}px`].join(";");
  $: ringOne = [`border-color: ${color}`].join(";");
  $: ringTwo = [`border-color: ${color}`].join(";");
</script>

<div style="{styles}" class="ringloader">
  <div style="{ringOne}"></div>
  <div style="{ringTwo}"></div>
</div>

<style>
  * {
    position: relative;
  }
  * > div {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 60px;
    height: 60px;
    opacity: 0.4;
    perspective: 800px;
    border-width: 6px;
    border-style: solid;
    border-image: initial;
    border-radius: 100%;
  }
  * > div:nth-child(1) {
    animation: 2s linear 0s infinite normal none running ring-one;
  }
  * > div:nth-child(2) {
    animation: 2s linear 0s infinite normal none running ring-two;
  }
  @keyframes ring-one {
    0% {
      transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    }
    100% {
      transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg);
    }
  }
  @keyframes ring-two {
    0% {
      transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    }
    100% {
      transform: rotateX(180deg) rotateY(360deg) rotateZ(360deg);
    }
  }
</style>
