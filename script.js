document.addEventListener('DOMContentLoaded', () => {
    const tank = document.getElementById('tank');
    const tankHead = document.getElementById('tank-head');
    const gameContainer = document.getElementById('container');
    const tankSpeed = 160; // Đơn vị: pixel/giây
    const bulletSpeed = 15;
    const bulletRange = 552; // tầm xa đạn
    const fireRate = 80; // số viên bắn tối đa trong 1 phút
    const reloadTime = 60000 / fireRate; // thời gian hồi đạn (ms)
    let lastShotTime = 0;
    let tankX = gameContainer.clientWidth / 2 - tank.clientWidth / 2;
    let tankY = gameContainer.clientHeight / 2 - tank.clientHeight / 2;
    let mouseX = 0;
    let mouseY = 0;
    let tankAngle = 0;
    let targetTankAngle = 0;
    let autoFire = false; // Trạng thái tự động bắn
    const keysPressed = {}; // Lưu trạng thái các phím đang được nhấn
    let lastFrameTime = Date.now();

    function updateTankPosition() {
        tank.style.transform = `translate(${tankX}px, ${tankY}px) rotate(${tankAngle}deg)`;
    }

    function moveTank() {
        const currentFrameTime = Date.now();
        const deltaTime = (currentFrameTime - lastFrameTime) / 1000; // thời gian giữa các khung hình (giây)
        lastFrameTime = currentFrameTime;

        let moveX = 0;
        let moveY = 0;

        if (keysPressed['w']) moveY -= 1;
        if (keysPressed['a']) moveX -= 1;
        if (keysPressed['s']) moveY += 1;
        if (keysPressed['d']) moveX += 1;

        // Chuẩn hóa vector di chuyển
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        if (length !== 0) {
            moveX = (moveX / length) * tankSpeed * deltaTime; // chuyển đổi tốc độ từ pixel/giây sang pixel/khung hình
            moveY = (moveY / length) * tankSpeed * deltaTime; // chuyển đổi tốc độ từ pixel/giây sang pixel/khung hình
        }

        if (moveX !== 0 || moveY !== 0) {
            targetTankAngle = Math.atan2(moveY, moveX) * (180 / Math.PI);
            targetTankAngle = (targetTankAngle + 360) % 360; // Đảm bảo góc nằm trong khoảng [0, 360]
        }

        // Xoay thân xe tăng một cách nhất quán theo chiều kim đồng hồ hoặc ngược chiều kim đồng hồ
        let angleDiff = targetTankAngle - tankAngle;
        if (angleDiff >= 180) {
            angleDiff -= 360;
        } else if (angleDiff <= -180) {
            angleDiff += 360;
        }

        const rotationSpeed = 15; // Điều chỉnh tốc độ quay
        if (angleDiff !== 0) {
            
            if (angleDiff > 0) {
                tankAngle += Math.min(angleDiff, rotationSpeed);
            } else {
                tankAngle += Math.max(angleDiff, -rotationSpeed);
            }
        }

        tankX += moveX;
        tankY += moveY;
        updateTankPosition();
        rotateTankHead();

        requestAnimationFrame(moveTank); // Tiếp tục cập nhật vị trí xe tăng
    }

    function createBullet(x, y, angle) {
        const bullet = document.createElement('div');
        bullet.classList.add('bullet');
        bullet.style.left = `${x}px`;
        bullet.style.top = `${y}px`;
        bullet.style.transform = `rotate(${angle}deg)`;
        gameContainer.appendChild(bullet);

        const radianAngle = angle * (Math.PI / 180);
        const velocityX = Math.cos(radianAngle) * bulletSpeed;
        const velocityY = Math.sin(radianAngle) * bulletSpeed;

        let traveledDistance = 0;

        function moveBullet() {
            x += velocityX;
            y += velocityY;
            traveledDistance += bulletSpeed;

            if (traveledDistance >= bulletRange) {
                bullet.remove();
                return;
            }

            bullet.style.left = `${x}px`;
            bullet.style.top = `${y}px`;

            requestAnimationFrame(moveBullet);
        }

        moveBullet();
    }

    function shoot(event) {
        const currentTime = Date.now();
        if (currentTime - lastShotTime < reloadTime) {

            return; // Không bắn nếu chưa hồi đạn
        }

        const rect = gameContainer.getBoundingClientRect();
        const targetX = event.clientX - rect.left;
        const targetY = event.clientY - rect.top;
        const tankHeadRect = tankHead.getBoundingClientRect();
        const tankHeadCenterX = tankHeadRect.left + tankHeadRect.width / 2 - rect.left;
        const tankHeadCenterY = tankHeadRect.top + tankHeadRect.height / 2 - rect.top;

        const deltaX = targetX - tankHeadCenterX;
        const deltaY = targetY - tankHeadCenterY;
        const bulletAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        createBullet(tankHeadCenterX, tankHeadCenterY, bulletAngle);
        lastShotTime = currentTime; // Cập nhật thời gian bắn cuối cùng
    }

    function autoShoot() {
        const currentTime = Date.now();
        if (currentTime - lastShotTime >= reloadTime && autoFire) {
            const rect = gameContainer.getBoundingClientRect();
            const targetX = mouseX - rect.left;
            const targetY = mouseY - rect.top;
            const tankHeadRect = tankHead.getBoundingClientRect();
            const tankHeadCenterX = tankHeadRect.left + tankHeadRect.width / 2 - rect.left;
            const tankHeadCenterY = tankHeadRect.top + tankHeadRect.height / 2 - rect.top;

            const deltaX = targetX - tankHeadCenterX;
            const deltaY = targetY - tankHeadCenterY;
            const bulletAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            createBullet(tankHeadCenterX, tankHeadCenterY, bulletAngle);
            lastShotTime = currentTime; // Cập nhật thời gian bắn cuối cùng
        }
        requestAnimationFrame(autoShoot);
    }

    function rotateTankHead(event) {
        const rect = gameContainer.getBoundingClientRect();
        if(event) {
            mouseX = event.clientX;
            mouseY = event.clientY;            
        }
        const targetX = mouseX - rect.left;
        const targetY = mouseY - rect.top;
        const tankRect = tank.getBoundingClientRect();
        const tankCenterX = tankRect.left + tankRect.width / 2 - rect.left;
        const tankCenterY = tankRect.top + tankRect.height / 2 - rect.top;

        const deltaX = targetX - tankCenterX;
        const deltaY = targetY - tankCenterY;
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        tankHead.style.transform = `translate(-50%, -50%) rotate(${angle - tankAngle}deg)`;
    }

    function toggleAutoFire(event) {
        if (event.button === 2) { // Chuột phải
            autoFire = !autoFire;
            if (autoFire) {
                autoShoot(); // Bắt đầu tự động bắn
            }
        }
    }

    document.addEventListener('keydown', (event) => {
        keysPressed[event.key] = true;
    });

    document.addEventListener('keyup', (event) => {
        keysPressed[event.key] = false;
    });

    gameContainer.addEventListener('click', shoot);
    gameContainer.addEventListener('mousemove', rotateTankHead);
    gameContainer.addEventListener('contextmenu', (event) => event.preventDefault()); // Ngăn context menu mặc định
    gameContainer.addEventListener('mousedown', toggleAutoFire);

    moveTank(); // Bắt đầu di chuyển xe tăng
    updateTankPosition();

    function notify() {

    }
});