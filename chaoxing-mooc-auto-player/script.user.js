// ==UserScript==
// @name              Chaoxing MOOC Auto Player
// @name:zh-CN        超星学习通自动播放
// @namespace         https://screw-hand.com/
// @version           2026.9.18
// @description       Auto-play Chaoxing MOOC videos and advance to the next section when finished.
// @description:zh-CN 播放完自动下一节，自动播放。
// @author            GinWU
// @license           MIT
// @homepageURL       https://github.com/GinWU05/tampermonkey-user.js/tree/main/chaoxing-mooc-auto-player
// @supportURL        https://github.com/GinWU05/tampermonkey-user.js/issues
// @icon              https://www.google.com/s2/favicons?sz=64&domain=chaoxing.com
// @match             https://mooc1.chaoxing.com/*
// @grant             none
// ==/UserScript==

(function () {
	'use strict';

	// 主函数，将在页面加载和内容变化时执行
	function initAutoPlayer() {
		console.log('开始检测视频...');

		// 查找所有iframe
		const iframes = document.querySelectorAll('iframe');
		if (iframes.length > 0) {
			console.log('找到iframes:', iframes.length);
			// 对每个iframe应用自动播放逻辑
			iframes.forEach(iframe => {
				try {
					if (iframe.contentDocument) {
						applyToIframe(iframe);
					} else {
						// 如果无法直接访问iframe内容，添加load事件监听
						iframe.addEventListener('load', function() {
							applyToIframe(iframe);
						});
					}
				} catch (e) {
					console.log('访问iframe内容失败:', e);
				}
			});
		}

		// 直接在当前文档中也查找视频
		const video = document.querySelector('video');
		if (video) {
			console.log('在主文档中找到视频');
			applyToVideo(video);
		}
	}

	// 处理iframe中的视频
	function applyToIframe(iframe) {
		try {
			const video = iframe.contentDocument.querySelector('video');
			if (video) {
				console.log('在iframe中找到视频');
				applyToVideo(video);
			}
		} catch (e) {
			console.log('处理iframe中的视频失败:', e);
		}
	}

	// 对视频应用自动播放和自动下一节逻辑
	function applyToVideo(video) {
		// 新增：检查是否已处理过该视频
		if (video.dataset.autoPlayed) return;
		console.log('应用视频自动播放逻辑');
		video.dataset.autoPlayed = 'true'; // 标记已处理

		// 自动播放逻辑
		let retryCount = 0;
		const MAX_RETRIES = 10;

		const playVideo = () => {
			const playPromise = video.play();
			if (playPromise !== undefined) {
				playPromise.then(() => {
					console.log('自动播放成功');
					retryCount = 0; // 重置重试次数
				}).catch(error => {
					console.log('自动播放被阻止，尝试重试', error);
					retryCount++;

					if (retryCount >= MAX_RETRIES) {
						alert('视频自动播放失败，请检查浏览器设置或手动播放');
						return;
					}

					// 尝试再次播放，延迟2秒
					setTimeout(playVideo, 2000);
				});
			}
		};

		// 尝试播放
		playVideo();

		// 监听视频结束事件
		video.addEventListener('ended', function () {
			console.log('视频播放结束');
			const nextButton = document.querySelector('#prevNextFocusNext') ||
							   window.top.document.querySelector('#prevNextFocusNext');

			if (nextButton) {
				console.log('找到下一节按钮，点击');
				nextButton.click();

				// 点击后延迟一段时间再次运行初始化函数
				setTimeout(initAutoPlayer, 3000);
			} else {
				console.log('未找到下一节按钮');
			}
		});
	}

	// 初始化：页面加载时执行
	window.addEventListener('load', initAutoPlayer);

	// 修改MutationObserver部分，添加防抖
	let debounceTimer;
	const observer = new MutationObserver(function(mutations) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					initAutoPlayer();
					break;
				}
			}
		}, 1000); // 防抖1秒
	});

	// 开始观察文档变化
	observer.observe(document.body, { childList: true, subtree: true });

	// 立即执行一次，以处理已加载的内容
	initAutoPlayer();
})();