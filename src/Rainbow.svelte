<script>
  export let size = 60;
  export let color = "#FF3E00";
  export let unit = "px";
</script>

<style>
  .wrapper {
    width: var(--size);
    height: calc(var(--size) / 2);
    overflow: hidden;
  }
  .rainbow {
    width: var(--size);
    height: var(--size);
    border-left-color: transparent;
    border-bottom-color: transparent;
    border-top-color: var(--color);
    border-right-color: var(--color);
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

<div class="wrapper" style="--size: {size}{unit}; --color: {color}">
  <div class="rainbow"></div>
</div>
