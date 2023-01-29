const config = {
	hash: true,
	
	hashOneBasedIndex: true, // starts with 1 as 1st page
	// fragmentInURL: false, // to work with onetimer.js & blackboard
	
	controls: false, // hide the arrows

	countdown: {
		defaultTime: 15,
		autostart: true,
		tDelta: 60,
		ending_color: "red",
		playTickSoundLast: 10,
		tickSound: "./../../backend/custom/plugins/countdown/tick.mp3",
		timeIsUpSound: "./../../backend/custom/plugins/countdown/gta_completed.mp3"
	},
	
	// no of slides
	// 2 = current slide and next slide
	viewDistance: 2,
	mobileViewDistance: 2,
	preloadIframes: true, // only within the view distance; it takes too otherwise too long

	hideCursorTime: 1000, // Time before the cursor is hidden (in ms)

	overview: false, // i don't really use it; why waste resources
	center: false,

	chalkboard: {
		storage: "Drawings",
		chalkEffect: 0.0
	},

	//- width: 1280,
	//- height: 1080,
	//- margin: 0,

	katex: {
		local: './../../backend/custom/plugins/katex',
	},

	menu: {
		openButton: true,
		transitions: true,
		themes: true,
		themesPath: "./../../backend/reveal.js-master/dist/theme"
	},

	pointer: {
		key: "p", // key to enable pointer, default "q", not case-sensitive
		pointerSize: 30, // pointer size in px, default 12
		opacity: 0.85 // opacity of cursor, default 0.8
	},

	navigationMode: "linear", // left-right arrows traverse horizontal and vertical slides
	keyboard: {
		// these are javascript keycodes
		90: 'togglePause'
	},

	pdfSeparateFragments: false,
	pdfMaxPagesPerSlide: 1
}

const mobile_config = {
	controls: true,
	toolbar: {
		fullscreen: true,
		captureMenu: true
	}
}

const slides = document.body.querySelector(".slides")

// function toggleFullScreen() {
//   if (!document.fullscreenElement) {
//     document.documentElement.requestFullscreen();
//   } else if (document.exitFullscreen) {
//     document.exitFullscreen();
//   }
// }

function is_mobile() {
	if (window.innerWidth < 1000)
		mobile = true
	else
		mobile = false

	return mobile
}

function notes_exist(slides)
{
	flag = false
	if (slides.querySelector("aside") != null)
		flag = 1
	return flag
}

const loadScript = src => {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.type = 'text/javascript'

		script.async = false
		script.defer = true

		script.onload = resolve
		script.onerror = reject
		script.src = src
		document.head.append(script)
	})
}

const loadStyle = href => {
	return new Promise((resolve, reject) => {
		const style = document.createElement('link');
		style.rel = "stylesheet";
		style.type = 'text/css';
		style.onload = resolve;
		style.onerror = reject;
		style.href = href;
		document.head.append(style);
	})
}

function set_themes(initial_theme) {
	const theme = document.head.querySelector("#theme")
	const light_themes = ["white", "sky", "beige", "simple", "serif", "solarized"]
	// const dark_themes = ["black.css", ]
	const reveal = document.body.querySelector(".reveal")

	const observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			new_theme = mutation.target.href.split("/").at(-1).split(".")[0]

			if (light_themes.includes(new_theme))
			{
				reveal.classList.add("light_theme")
				reveal.classList.remove("dark_theme")
			}
			else //if (dark_themes.includes(new_theme))
			{
				reveal.classList.add("dark_theme")
				reveal.classList.remove("light_theme")
			}
		});
	});

	observer.observe(
		theme, {
		attributeFilter: ["href"]
	});

	// initial theme
	theme.setAttribute(
		"href",
		"./../../backend/reveal.js-master/dist/theme/" + initial_theme + ".css"
	)
}

function footer(slides) {
	function get_correct_footer_parent(element){
		if(element.tagName === "SECTION"){
			return element
		}
		else{
			return get_correct_footer_parent(element.parentNode)
		}
	}

	slides.querySelectorAll("[attr]").forEach(function(element){
		const footer_content = element.getAttribute("attr")
		const footer = document.createElement("footer")
		footer.textContent = "Source: " + footer_content
		
		if(element.tagName != "SECTION")
		{
			const fragment_index = element.getAttribute("data-fragment-index")
			if (fragment_index != null)
			{
				// same fragment index as the element
				footer.setAttribute( 
					"data-fragment-index", 
					fragment_index
				)
				footer.classList.add("fragment")
			}
		}

		get_correct_footer_parent(element).appendChild(footer)

	})
}

function equation_exists(slides) {
	let equation_flag = false

	for (const element of slides.querySelectorAll("*:not(section):not(img):not(video):not(audio):not(iframe)"))
		if (element.textContent.includes("$")) {
			equation_flag = true
			break
		}

	return equation_flag
}

function code_exists(slides) {
	let code_flag
	if (slides.querySelector("code") != null)
		code_flag = true
	else
		code_flag = false

	return code_flag
}

function mathjs_required(equation_flag, code_flag) {
	return equation_flag || code_flag
}

(function () {
	const assetLoc = "assets/"

	if (slides === null)
		return

	check_externals_have_fallback(slides)

	appendix(slides)
        toc(slides)

        code_blocks(slides)
	fragments(slides)

	load_assets(slides, assetLoc)
	load_bgs(slides, assetLoc)

	notes(slides)
	tables(slides)
	rstack(slides)
	menu_names(slides)
	bg_color(slides)

	// mer(slides)
	// preconnect_external(slides)
})()

function toc(slides, toc_position=2) {
	const toc_placeholder = document.createElement("section")
	
	const toc_title = document.createElement("h1")
	toc_title.textContent = "Overview"
	toc_placeholder.appendChild(toc_title)

	let toc_list = document.createElement("ul")
	const titles = slides.querySelectorAll('.cover:not([data-visibility="uncounted"]) > h1')
	
	titles.forEach( function(title){
		const item = document.createElement("li")
		item.textContent = title.textContent
		item.classList.add("fragment") // precaution, incase i re-arrange function calls
		toc_list.appendChild(item)
	})

	toc_placeholder.appendChild(toc_list)

	const next_slide = slides.children[toc_position-1]
	if (next_slide != null)
		slides.insertBefore(toc_placeholder, next_slide)
	else
		slides.appendChild(toc_placeholder)
}

function check_externals_have_fallback(slides) {
	["data", "href"].forEach(function (type) {
		slides.querySelectorAll(`[${type}^="http"]`).forEach(function (element) {
			if (element.getAttribute("fallback") === null) {
				alert(`
Fallback missing for ${element.tagName} with
${element.getAttribute("data")}`)
				return false
			}
		})
	})

	return true
}

// lazy loading assets
// this does not affect background images - it's actually good cuz we want the transition to look good
function load_assets(slides, assetLoc) {
	slides.querySelectorAll("img, video, audio").forEach(function (asset) {
		// iframes should always be full so they are included here

		asset.setAttribute("loading", "lazy")

		asset.setAttribute("data-src", choose_asset_location(asset, assetLoc))

		if (asset.tagName == "AUDIO")
			asset.setAttribute("data-autoplay", "true")

	})
}

function fragments(slides) {
	const my_list = [
		"img:not(.fallback)",
		"video",
		"iframe",
		"li",
		"span",
		".f",
		// "table:not(table.table-striped)",
		"td:not(table.table-striped td)",
		"td:not(table.nf td):not(table.table-striped td)",
		"th:not(table.table-striped th):not(table.nf th)"
		// even ul:not(ul ul) isn't ideal
	]

	let query_list = []
	my_list.forEach(function (element) {
		query_list.push(element + ":not(.nf)")
	})

	slides.querySelectorAll(query_list).forEach(function (fragment) {
		fragment.classList.add("fragment")
	})
}


function appendix(slides) {
	slides.querySelectorAll(".appendix, .appendix > section").forEach(function (appendix_section) {
		appendix_section.setAttribute("data-visibility", "uncounted")
	})
}

function notes(slides) {
	slides.querySelectorAll("aside").forEach(function (note) {
		note.classList.add("notes")
		note.setAttribute("data-markdown", "")
	})
}


// markdown table
function tables(slides) {
	// i don't want this
	// slides.querySelectorAll("table").forEach(function (table) {
	// 	table.setAttribute("data-markdown", true)
	// })
}

function rstack(slides) {
	slides.querySelectorAll(".rs").forEach(function (rstack) {
		rstack.classList.add("r-stack")
	})
}

function menu_names(slides) {
	slides.querySelectorAll("section[menu]").forEach(function (section) {
		let name = section.getAttribute("menu")

		if (name === null)
			return

		section.setAttribute("data-menu-title", name)
	})
}

function bg_color(slides) {
	slides.querySelectorAll("section[color]").forEach(function (section) {
		let color = section.getAttribute("color")
		if (color === null)
			return

		section.setAttribute("data-background-color", color)
	})
}

function choose_asset_location(element, assetLoc) {
	let location
	let data = element.getAttribute("data")

	if (!data.startsWith("http")) // offline asset
		location = assetLoc + data
	else { // online asset
		if (navigator.onLine)
			location = data
		else
			location = element.getAttribute("fallback")
	}

	return location
}

// renaming
function load_bgs(slides, assetLoc) {
	const img_ext = ["jpg", "jpeg", "png", "svg", "webp"]
	const vid_ext = ["mp4", "mov", "webm"]
	const aud_ext = ["mp3", "ogg", "aac", "ac3"]

	const bg_slides = slides.querySelectorAll("section[data]")

	bg_slides.forEach(function (section) {
		const location = choose_asset_location(section, assetLoc)

		const filename = location.split('\\').pop().split('/').pop()
		const name = filename.split(".")[0]
		const ext = filename.split(".")[1]


		if (img_ext.includes(ext))
			add_bg_img(section, location)
		else if (vid_ext.includes(ext))
			add_bg_vid(section, location)
		else if (aud_ext.includes(ext))
			add_bg_audio(section, location)
		else // iframe
			add_bg_iframe(section, location)

		// name of non-cover section will be the name of media
		if (!(section.classList.contains("cover"))) {
			section.setAttribute("data-menu-title", name)
		}

		if (
			!section.classList.contains("cover") &&
			!section.classList.contains("full")
		)
			section.setAttribute("data-background-size", "contain")


	})
}

function add_bg_img(section, location) {
	section.setAttribute("data-background-image", location)
}

function add_bg_vid(section, location) {
	section.setAttribute("data-background-video", location)
}

function add_bg_audio(section, location) {
	section.setAttribute("data-background-audio", location)
}

function add_bg_iframe(section, location) {
	section.setAttribute("data-background-iframe", location)
}

// in order to use mermaid code, i just say .mermaid at the place of the code
function mer(slides) {
	const mer = slides.getElementsByClassName("mermaid")
	for (let i = 0; i < mer.length;) { // no updation - this works cuz the last element is removed
		const parentElement = mer[i].parentElement
		const parentNode = mer[i].parentNode
		if (parentElement === null || parentNode === null)
			return

		const slide = parentElement.classList
		slide.add("diagram-slide")

		const display = document.createElement("div")
		display.classList.add("diagram-display"); // , "fragment"
		display.classList.add("fragment")
		parentNode.appendChild(display)

		const data = mer[i]
		data.classList.add("diagram-data")
		data.classList.remove("mermaid")
	}
}

function unique_elements(my_list) {
	const unique = []
	const map = new Map()
	my_list.forEach(function (item) {
		if (map.has(item) || item === null)
			return

		map.set(item, true);    // set any value to Map
		unique.push(item)
	})
	return unique
}

// eager loading
function preconnect(link) {
	const preconnect = document.createElement("link")
	const dns_prefetch = document.createElement("link")

	preconnect.setAttribute("rel", "preconnect")
	dns_prefetch.setAttribute("rel", "dns-prefetch")

	preconnect.setAttribute("href", link)
	dns_prefetch.setAttribute("href", link)

	document.head.appendChild(preconnect)
	document.head.appendChild(dns_prefetch)
}

function preconnect_external(slides) {
	let external_links = [];

	["data", "href"].forEach(function (type) {
		slides.querySelectorAll(`[${type}^="http"]`).forEach(function (element) {
			const link = element.getAttribute(type);
			if (link === null)
				return
			external_links.push(new URL(link).origin); // we only want the domain, so we can check unique later
		})
	});

	(
		unique_elements(external_links) // don't request the same page twice
			.forEach(preconnect)
	)
}

document.body.querySelectorAll(".attr").forEach(function (attr) {
	attr.textContent = "Credits: " + attr.textContent
})

function code_blocks(slides){
	slides.querySelectorAll(".code").forEach(function(code_block){
		let line_numbers = code_block.getAttribute("lines");
		
		let idk = "<pre><code "
		if(line_numbers != null)
			idk += "data-line-numbers=" + line_numbers + " ";
		idk += "data-trim data-noescape>" + // contenteditable
														code_block.innerHTML +
														"</code></pre>"
		code_block.innerHTML = idk;
	})
}

function countdown_exists(slides)
{
	let flag = false
	if(document.querySelector("countdown") || document.querySelector("[countdown]"))
	{
		flag = true
	}
	return flag
}
