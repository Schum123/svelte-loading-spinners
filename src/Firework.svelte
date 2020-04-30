<script>
import { css, keyframes } from "emotion";
export let size = 60;
export let color = '#FF3E00';
export let unit = 'px'

const fire = keyframes`
    0% {opacity: 1;transform: scale(0.1);}
    25% {opacity: 0.85;}
    100% {transform: scale(1);opacity: 0;}
`;
const wrapper = css`
    width: ${size * 1.3+unit};
    height: ${size * 1.3+unit};
    display: flex;
    justify-content: center;
    align-items: center;
`;
const firework  = css`
    border: ${size / 10+unit} dotted ${color};
    width: ${size+unit};
    height: ${size+unit};
    border-radius: 50%;
    animation: ${fire} 1.25s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
`;
</script>
<div class="{wrapper}">
    <div class="{firework}" />
</div>
      