<script>
  import { range } from "./utils";
  export let size = 60;
  export let color = "#FF3E00";
  export let unit = "px";
</script>

<style>
  span {
    width: var(--size);
    height: calc(var(--size) / 4);
    position: relative;
  }
  div {
    width: calc(var(--size) / 4);
    height: calc(var(--size) / 4);

    position: absolute;
    left: 0;
    top: 0;
    border-radius: 2px;
    background: var(--color);
    transform: translateX(-50%) rotate(45deg) scale(0);
    animation: diamonds 1500ms linear infinite;
  }
  div:nth-child(1) {
    animation-delay: -1s;
  }
  div:nth-child(2) {
    animation-delay: -2s;
  }
  div:nth-child(3) {
    animation-delay: -3s;
  }

  @keyframes diamonds {
    50% {
      left: 50%;
      transform: translateX(-50%) rotate(45deg) scale(1);
    }
    100% {
      left: 100%;
      transform: translateX(-50%) rotate(45deg) scale(0);
    }
  }
</style>

<span style="--size: {size}{unit}; --color:{color}">
  <div></div>
  <div></div>
  <div></div>
</span>
