<script>
  import { css, keyframes } from "emotion";
  import { range } from "./utils";
  export let size;
  export let color;

  const ringOne = keyframes`
    0% {transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);}
    100% {transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg);}
`;
  const ringTwo = keyframes`
    0% {transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);}
    100% {transform: rotateX(180deg) rotateY(360deg) rotateZ(360deg);}
`;
  const wrapper = css`
    position: relative;
    width: ${size}px;
    height: ${size}px;
  `;
  const border = css`
    border-color: ${color};
    position: absolute;
    top: 0px;
    left: 0px;
    width: ${size}px;
    height: ${size}px;
    opacity: 0.4;
    perspective: 800px;
    border-width: 6px;
    border-style: solid;
    border-image: initial;
    border-radius: 100%;
  `
</script>

<div class="{wrapper}">
    {#each range(2, 1) as version}
    <div 
    class="{border}"
    style="animation: 2s linear 0s infinite normal none running {(version === 1) ? ringOne : (version === 2) ? ringTwo :``}"
    version="{version}"
    />
    {/each}
</div>
