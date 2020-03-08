<script>
import { css, keyframes } from "emotion";
import { range  } from './utils'

export let size;
export let color;

const motion = keyframes`
    0% {opacity: 1;}
    50% {opacity: 0;}
    100% {opacity: 1;}
`;

const wrapper = css`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${size}px;
    height: ${size / 2.5}px;
`;

const cube = css`
    position: absolute;
    top: 0px;
    width: ${size / 5}px;
    height: ${size / 2.5}px;
    background-color: ${color};
    animation: ${motion} 1.5s cubic-bezier(0.895, 0.03, 0.685, 0.22) infinite;
`;


</script>
<div class="{wrapper}">
    {#each range(3, 0) as version}
        <div class="{cube}" style="animation-delay: {version * .15}s; left: {version * (size / 3 + size / 15)}px;"/>
    {/each}
</div>