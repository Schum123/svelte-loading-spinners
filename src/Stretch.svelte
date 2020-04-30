<script>
  import { css, keyframes } from "emotion";
  import { range } from "./utils";

  export let size = 60;
  export let color = '#FF3E00';
  export let duration = "1.2s";
  export let unit = 'px'
  const stretch = keyframes`
    0%,
    40%,
    100% {transform: scaleY(0.4);}
    20% {transform: scaleY(1);}
  `;

  const wrapper = css`
    width: ${size+unit};
    height: ${size+unit};
    display: inline-block;
    text-align: center;
    font-size: 10px;
  `;
  const rect = css`
    animation: ${stretch} ${duration} ease-in-out infinite;
    background-color: ${color};
    height: 100%;
    width: 10%;
    display: inline-block;
    margin-right: 4px;
  `;
</script>

<div class="{wrapper}">
    {#each range(5, 1) as version}
    <div 
    class="{rect}"
    style="animation-delay: {version === 2 ? '-1.1s' : version === 3 ? '-1s' : version === 4 ? '-0.9s' : version === 5 ? '-0.8s': ''}"
    />
    {/each}
</div>
