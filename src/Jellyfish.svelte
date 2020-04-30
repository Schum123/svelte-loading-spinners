<script>
    import { css, keyframes } from "emotion";
    import { range  } from './utils'
    
    export let size = 60;
    export let color = '#FF3E00';
    export let unit = "px";
    
    const motion = keyframes`
        0% {transform: ${`translateY(${-size / 5+unit});`};}
        50% {transform: ${`translateY(${size / 4+unit})`};}
        100% {transform: ${`translateY(${-size / 5+unit})`};}
    `;
    
    const wrapper = css`
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: ${size+unit};
        height: ${size+unit};
    `;
    
    const ring = css`
        position: absolute;
        border: 2px solid ${color};
        border-radius: 50%;
        background-color: transparent;
        animation: ${motion} 2.5s ease infinite;
    `;
    
    
    </script>
    <div class="{wrapper}">
        {#each range(6, 0) as version}
            <div class="{ring}" style="animation-delay: {version * 100}ms; width: {version * (size / 6)+unit}; height: {version * (size / 6) / 2+unit}; "/>
        {/each}
    </div>