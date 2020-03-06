<script>
  export let size;
  export let color;
  $: styles = [
    `width: ${size}px`,
    `height: ${size}px`,
    `border-color: ${color}`,
    `border-color: ${color} transparent ${color} ${color}`
  ].join(";");
</script>

<div style="{styles}" class="spinner spinner--circle"></div>
<style>
  .spinner--circle {
    border-width: 6px;
    border-style: solid;
    border-image: initial;
    border-radius: 50%;
    animation: 0.75s linear 0s infinite normal none running rotate;
  }
  @keyframes rotate {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
