<script>
  export let size;
  export let color;
  export let duration = "1.0s";
  $: styles = [
    `width: ${size}px`,
    `height: ${size}px`,
    `background-color: ${color}`,
    `animation-duration: ${duration}`
  ].join(";");
</script>

<div class="spinner spinner--scaleout" style="{styles}"></div>

<style>
  * {
    border-radius: 100%;
    display: inline-block;
    animation: sk-scaleout 1s ease-in-out infinite;
  }
  @keyframes sk-scaleout {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
</style>
