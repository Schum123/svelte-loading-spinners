<script>
  import { css, keyframes } from "emotion";
  import { range } from "./utils";
  export let size;
  export let color;
  let y = 0;

  const motion = keyframes`
    25% {transform: skewY(25deg);}
    50% {height: 100%;margin-top: 0;}
    75% {transform: skewY(-25deg);}
  `;
  const wrapper = css`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${size * 2.5}px;
    height: ${size}px;
    overflow: hidden;
  `;
  const bar = css`
    position: absolute;
    top: ${y + size / 10}px;
    width: ${size / 5}px;
    height: ${size / 10}px;
    margin-top: ${size - size / 10}px;
    transform: skewY(0deg);
    background-color: ${color};
    animation: ${motion} 1.25s ease-in-out infinite;
`;
</script>

<div class="{wrapper}">
    {#each range(10, 1) as version}
    <div 
    class="{bar}"
    style="left: {version * (size / 5 + (size / 15 - size / 100))}px; animation-delay: {version * 0.15}s;"
    />
    {/each}
</div>
