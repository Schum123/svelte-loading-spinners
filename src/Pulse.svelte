<script>
import { css, keyframes } from "emotion";
import { range  } from './utils'

export let size = 60;
export let color = '#FF3E00';
export let unit = 'px';

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
    width: ${size+unit};
    height: ${size / 2.5+unit};
`;

const cube = css`
    position: absolute;
    top: 0px;
    width: ${size / 5+unit};
    height: ${size / 2.5+unit};
    background-color: ${color};
    animation: ${motion} 1.5s cubic-bezier(0.895, 0.03, 0.685, 0.22) infinite;
`;


</script>
<div class="{wrapper}">
    {#each range(3, 0) as version}
        <div class="{cube}" style="animation-delay: {version * .15}s; left: {version * (size / 3 + size / 15)+unit};"/>
    {/each}
</div>