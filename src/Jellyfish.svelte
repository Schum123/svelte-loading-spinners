<script>
    import { css, keyframes } from "emotion";
    import { range  } from './utils'
    
    export let size;
    export let color;
    
    const motion = keyframes`
        0% {transform: ${`translateY(${-size / 5}px);`};}
        50% {transform: ${`translateY(${size / 4}px)`};}
        100% {transform: ${`translateY(${-size / 5}px)`};}
    `;
    
    const wrapper = css`
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: ${size}px;
        height: ${size}px;
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
            <div class="{ring}" style="animation-delay: {version * 100}ms; width: {version * (size / 6)}px; height: {version * (size / 6) / 2}px; "/>
        {/each}
    </div>