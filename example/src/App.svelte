<script>
	import { 
		Circle, 
		Circle2, 
		Circle3, 
		DoubleBounce, 
		GoogleSpin, 
		ScaleOut, 
		SpinLine, 
		Stretch, 
		BarLoader, 
		Jumper, 
		RingLoader, 
		SyncLoader, 
		Rainbow, 
		Wave, 
		Firework, 
		Pulse, 
		Jellyfish,
		Chasing,
		Shadow,
		Square,
		Moon,
		Plane,
		Diamonds
		} from "../../src/index";
	export let name;

	let color = "#FF3E00";
	let size = "60";
	let unit = "px";
  
  </script>
  
  <style>
	.header {
	  margin-top: 50px;
	  display: flex;
      flex-direction: column;
	}
	h1 {
	  color: #ff3e00;
	  font-size: 48px;
	  font-weight: 400;
	  margin-top: 0;
	  margin-bottom: 10px;
	  text-align: center;
	}
	section {
	align-items: center;
	justify-items: center;
	display: grid;
	grid-gap: 1rem;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	}
	.spinner-item {
	  min-width: 250px;
	  min-height: 250px;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  position: relative;
	}
	.spinner-title {
	  position: absolute;
	  bottom: 20px;
	}
	.btn {
	  margin-top: 20px;
	  padding: 10px 30px;
	  border-radius: 30px;
	  display: block;
	  margin: 0 auto;
	  color: #fff;
	  background-color: rgba(255, 62, 0, 1);
	  transition: all 0.15s ease;
	  box-sizing: border-box;
	  text-transform: uppercase;
	  text-decoration: none;
	}
	.btn:hover {
	  background-color: rgba(255, 62, 0, 0.8);
	}
  </style>
  <div class="header">
	<h1>{name.default}</h1>
	<a href="https://github.com/Schum123/svelte-loading-spinners" class="btn"
	  >Github</a
	>
  </div>
  <section>

	<!-- <input type="color" bind:value={color}> -->
  
	<div class="spinner-item" title="SpinLine">
		  <SpinLine size={size} color={color}/>
		  <div class="spinner-title">SpinLine</div>
	  </div>
   
	  <div class="spinner-item" title="Circle2">
			  <Circle2 size={size} unit={unit} colorOuter="#FF3E00" colorCenter="#40B3FF" colorInner="#676778"/>
			  <div class="spinner-title">Circle2</div>
	  </div>
	  <div class="spinner-item" title="DoubleBounce">
			  <DoubleBounce size={size} color={color}/>
			  <div class="spinner-title">DoubleBounce</div>
	  </div>
	  <div class="spinner-item" title="Circle">
			  <Circle size={size} color={color} unit={unit}/>
			  <div class="spinner-title">Circle</div>
	  </div>
	  <div class="spinner-item" title="Stretch">
			  <Stretch size={size} color={color}/>
			  <div class="spinner-title">Stretch</div>
	  </div>
	  <div class="spinner-item" title="Circle3">
			  <Circle3 size={size} unit={unit} ballTopLeft="#FF3E00" ballTopRight="#F8B334" ballBottomLeft="#40B3FF" ballBottomRight="#676778"/>
			  <div class="spinner-title">Circle3</div>
	  </div>
	  <div class="spinner-item" title="BarLoader">
			  <BarLoader size={size} color={color} unit={unit} />
			  <div class="spinner-title">BarLoader</div>
	  </div>
	  <div class="spinner-item" title="SyncLoader">
			  <SyncLoader size={size} color={color}/>
			  <div class="spinner-title">SyncLoader</div>
	  </div>
	  <div class="spinner-item" title="Jumper">
			  <Jumper size={size} color={color}/>
			  <div class="spinner-title">Jumper</div>
	  </div>
	  <div class="spinner-item" title="GoogleSpin">
			  <GoogleSpin size="60px"/>
			  <div class="spinner-title">GoogleSpin</div>
	  </div>
	  <div class="spinner-item" title="ScaleOut">
			  <ScaleOut size={size} color={color}/>
			  <div class="spinner-title">ScaleOut</div>
	  </div>
	  <div class="spinner-item" title="RingLoader">
			  <RingLoader size={size} color={color}/>
		  <div class="spinner-title">RingLoader</div>
		</div>
		<div class="spinner-item" title="Rainbow">
			  <Rainbow size={size} color={color}/>
		  <div class="spinner-title">Rainbow</div>
		</div>
		<div class="spinner-item" title="Wave">
			  <Wave size={size} color={color}/>
		  <div class="spinner-title">Wave</div>
		</div>
		<div class="spinner-item" title="Firework">
			  <Firework size={size} color={color}/>
		  <div class="spinner-title">Firework</div>
		</div>
		<div class="spinner-item" title="Pulse">
			  <Pulse size={size} color={color}/>
		  <div class="spinner-title">Pulse</div>
	  	</div>
		<div class="spinner-item" title="Jellyfish">
			<Jellyfish size={size} color={color}/>
			<div class="spinner-title">Jellyfish</div>
		</div>
		<div class="spinner-item" title="Chasing">
			<Chasing size={size} color={color} unit={unit}/>
			<div class="spinner-title">Chasing</div>
		</div>
		<div class="spinner-item" title="Shadow">
			<Shadow size={size} color={color}/>
			<div class="spinner-title">Shadow</div>
		</div>
		<div class="spinner-item" title="Square">
			<Square size={size} color={color}/>
			<div class="spinner-title">Square</div>
		</div>
		<div class="spinner-item" title="Moon">
			<Moon size={size} color={color}/>
			<div class="spinner-title">Moon</div>
		</div>
		<div class="spinner-item" title="Plane">
			<Plane size={size} color={color}/>
			<div class="spinner-title">Plane</div>
		</div>
		<div class="spinner-item" title="Diamonds">
			<Diamonds size={size} color={color}/>
			<div class="spinner-title">Diamonds</div>
		</div>
  </section>