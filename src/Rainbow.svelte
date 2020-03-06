<script>
  export let size;
  export let color;
  $: styles = [
    `width: ${size}px`,
    `height: ${size / 2}px`,
    `overflow: hidden`
  ].join(";");
  console.log(`${size / 2}`);
  $: border = [
    `border-top-color: ${color}`,
    `border-right-color: ${color};`
  ].join(";");
  $: wrapper = [`width: ${size}px`, `height: ${size}px`].join(";");
</script>

<div style="{styles}" class="rainbow-wrapper">
  <div style="{[border + wrapper]}" class="rainbow"></div>
</div>

<style>
  .rainbow {
    border-left-color: transparent;
    border-bottom-color: transparent;
    box-sizing: border-box;
    transform: rotate(-200deg);
    border-radius: 50%;
    border-style: solid;
    animation: 3s ease-in-out 0s infinite normal none running rotate;
  }

  @keyframes rotate {
    0% {
      border-width: 10px;
    }
    25% {
      border-width: 3px;
    }
    50% {
      transform: rotate(115deg);
      border-width: 10px;
    }
    75% {
      border-width: 3px;
    }
    100% {
      border-width: 10px;
    }
  }
</style>
