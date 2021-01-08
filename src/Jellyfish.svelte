<script>
  import { range, durationUnitRegex } from "./utils";

  export let size = 60;
  export let color = "#FF3E00";
  export let unit = "px";
  export let duration = "2.5s";

  let durationUnit = duration.match(durationUnitRegex)[0];
  let durationNum = duration.replace(durationUnitRegex, "");
</script>
<style>
  .wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--size);
    height: var(--size);
  }
  .ring {
    position: absolute;
    border: 2px solid var(--color);
    border-radius: 50%;
    background-color: transparent;
    animation: motion var(--duration) ease infinite;
  }
  @keyframes motion {
    0% {
      transform: translateY(var(--motionOne));
    }
    50% {
      transform: translateY(var(--motionTwo));
    }
    100% {
      transform: translateY(var(--motionThree));
    }
  }
</style>

<div
  class="wrapper"
  style="--size: {size}{unit}; --color: {color}; --motionOne: {-size/5}{unit}; --motionTwo: {size/4}{unit}; --motionThree: {-size/5}{unit}; --duration: {duration};"
>
  {#each range(6, 0) as version}
  <div
    class="ring"
    style="animation-delay: {version * (durationNum/25)}{durationUnit}; width: {version * (size / 6)+unit}; height: {version * (size / 6) / 2+unit}; "
  ></div>
  {/each}
</div>
