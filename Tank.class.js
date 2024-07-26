'use strict';

class Tank {
    #tankStats;
    #buffStats = {
        jointStrike: false,
        disperse: false,
        movingSpeed: {},
        fireRate: {},
        bulletSpeed: {},
    };
    #configStats = {
        x: 100,
        y: 100,
        scale: 1,
        limitScale: 1.03,
        angle: 0,
        targetAngle: 0,
        mouseX: 0,
        mouseY: 0,
        autoFire: false,
        keysPressed: {},
        lastFrameTime: Date.now(),
        frameTime: 0,
        lastShotTime: 0,
    };

    /**
     * 
     * @param {{ 
     *      movingSpeed: Number, bulletSpeed: Number, bulletRange: Number, fireRate: Number 
     *      hp: Number, atk: Number, def: Number, pen: Number,
     * }} tankStats 
     * @param {HTMLDivElement} container 
     */
    constructor(tankStats, container) {
        this.#tankStats = tankStats;

        this.container = container;
        this.body = document.createElement('div');
        this.body.tank = this;
        this.head = document.createElement('div');
        this.body.classList.add('tank');
        this.head.classList.add('tank-head');
        this.body.appendChild(this.head);
    }

    /**
     * @param {'joint-strike' | 'disperse' | 'movingSpeed' | 'bulletRange' | 'bulletSpeed' | 'fireRate'} key 
     * @param {number} percent -- %
     * @param {number} time -- seconds
     * @param {String} id 
     * @param {Object} param4 
     * @param {boolean} param4.stack 
     * @param {number} param4.maxStack 
     */
    buff(key, percent, time, id, {stack, maxStack} = {stack: undefined, maxStack: undefined}) {
        switch (key) {
            case 'joint-strike':
            case 'disperse':
                this.#buffStats[['joint-strike', 'disperse'].filter(buff => buff !== key)[0]] = false;
                this.#buffStats[key] = true;
                this.body.classList.add(key);
                if(time !== Infinity) {
                    setTimeout(() => {
                        this.#buffStats[key] = false;
                        this.body.classList.remove(key);
                    }, time * 1000);                    
                }
                break;

            case "movingSpeed":
            case "bulletRange":
            case "bulletSpeed":
            case "fireRate":
                this.#buffStats[key] ??= {};

                if(id) {
                    this.#buffStats[key][id] ??= {};
                    this.#buffStats[key][id].stack ??= 0;
                    this.#buffStats[key][id].value ??= 0;
                    
                    if(stack) {
                        if(this.#buffStats[key][id].stack < maxStack) {
                            this.#buffStats[key][id].stack++;
                            this.#buffStats[key][id].value += percent;
                        }
                    } else {
                        this.#buffStats[key][id].value = percent;
                    }
                    if(time !== Infinity) {
                        clearTimeout(this.#buffStats[key][id].timeout);
                        this.#buffStats[key][id].timeout = setTimeout(() => {
                            this.#buffStats[key][id].stack = 0;
                            this.#buffStats[key][id].value = 0;
                            this.#buffStats[key][id].timeout = 0;
                        }, time * 1000);
                    }
                } else {
                    // this.#buffStats[key]['no-id'] ??= {};
                    // this.#buffStats[key]['no-id'] = percent;
                }

                break;

            default:
                break;
        }
    }

    /**
     * @param {Number} x 
     * @param {Number} y 
     * @returns {Tank}
     */
    place(x, y) {
        this.#configStats.x = x;
        this.#configStats.y = y;
        return this;
    }

    /**
     * @returns {Tank}
     */
    control() {
        const { container } = this;
        
        document.addEventListener('keydown', (event) => {
            this.#configStats.keysPressed[event.key] = true;
            switch(event.key) {
                case 'q': this.buff('disperse', 0, 8); break;
                case 'e': this.buff('joint-strike', 0, 8); break;
                case ' ':
                    this.buff('movingSpeed', 50, 3, 'space');
                    this.buff('fireRate', 100, 3, 'space');
                    this.buff('bulletSpeed', 50, 3, 'space');
                    this.buff('bulletRange', 50, 3, 'space');
                    this.body.classList.add('space');
                    setTimeout(() => {this.body.classList.remove('space')}, 3000);
                    break;
            }
        });
        document.addEventListener('keyup', (event) => {
            this.#configStats.keysPressed[event.key] = false;
        });
        container.addEventListener('click', this.#shoot.bind(this));
        container.addEventListener('mousemove', this.#rotateHead.bind(this));
        container.addEventListener('contextmenu', (event) => event.preventDefault());
        container.addEventListener('mousedown', (event) => {
            if (event.button === 2) { // Chuột phải
                if (this.#configStats.autoFire = !this.#configStats.autoFire) {
                    this.#autoShoot();
                }
            }
        });

        return this;
    }

    /**
     * @returns {Tank}
     */
    attach() {
        this.container.appendChild(this.body);
        this.#move();
        this.#updatePosition();

        return this;
    }

    #updatePosition() {
        const { x, y, angle, scale } = this.#configStats;
        this.body.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${scale})`;
    }

    #move() {
        const { lastFrameTime, keysPressed, angle } = this.#configStats;
        let { movingSpeed } = this.#tankStats;
        let plusMovingSpeed = 0;
        const currentFrameTime = Date.now();

        // thời gian giữa các khung hình (giây)
        const deltaTime = (currentFrameTime - lastFrameTime) / 1000;

        // Gán lại time frame
        this.#configStats.lastFrameTime = currentFrameTime;

        // Buff tốc độ di chuyển
        for (const id in this.#buffStats.movingSpeed) {
            const percent = this.#buffStats.movingSpeed[id].value;
            if(percent) {
                plusMovingSpeed += movingSpeed * percent / 100;
            }
        }
        movingSpeed += plusMovingSpeed;

        let moveX = 0;
        let moveY = 0;
        if (keysPressed['w']) moveY -= 1;
        if (keysPressed['a']) moveX -= 1;
        if (keysPressed['s']) moveY += 1;
        if (keysPressed['d']) moveX += 1;

        // Chuẩn hóa vector di chuyển
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        if (length !== 0) {
            // chuyển đổi tốc độ từ pixel/giây sang pixel/khung hình
            moveX = (moveX / length) * movingSpeed * deltaTime;
            moveY = (moveY / length) * movingSpeed * deltaTime;
        }

        // Xoay thân xe
        if (moveX !== 0 || moveY !== 0) {
            this.#configStats.targetAngle = Math.atan2(moveY, moveX) * (180 / Math.PI);
            // Đảm bảo góc nằm trong đoạn [0, 360]
            this.#configStats.targetAngle = (this.#configStats.targetAngle + 360) % 360;
        }

        let angleDiff = this.#configStats.targetAngle - angle;
        if (angleDiff >= 180) {
            angleDiff -= 360;
        } else if (angleDiff <= -180) {
            angleDiff += 360;
        }

        // Tốc độ quay
        const rotationSpeed = movingSpeed / 15;

        if (angleDiff !== 0) {
            if (angleDiff > 0) {
                this.#configStats.angle += Math.min(angleDiff, rotationSpeed);
            } else {
                this.#configStats.angle += Math.max(angleDiff, -rotationSpeed);
            }
        }
        
        // Kiểm tra va chạm
        const newX = this.#configStats.x + moveX;
        const newY = this.#configStats.y + moveY;
        if (checkCollision.bind(this)(newX, newY)) {
            if(this.#configStats.scale < this.#configStats.limitScale) {
                this.#configStats.scale += 0.01;
            } else {
                this.#configStats.scale = 1;
            }
        } else {
            this.#configStats.scale = 1;
            this.#configStats.x = newX;
            this.#configStats.y = newY;
        }

        this.#updatePosition();
        this.#rotateHead();

        // Tiếp tục cập nhật vị trí
        requestAnimationFrame(this.#move.bind(this));

        function checkCollision(nextX, nextY) {
            const objects = document.querySelectorAll('.object');
            const collision = (nextX, nextY, tank, object, tolerance = 20) => {
                if(tank === object) return;
                const tankRect = tank.getBoundingClientRect();
                const objectRect = object.getBoundingClientRect();
            
                // Giả lập vị trí mới của xe tăng
                const tankNew = {
                    top: tankRect.top + (nextY - this.#configStats.y),
                    bottom: tankRect.bottom + (nextY - this.#configStats.y),
                    left: tankRect.left + (nextX - this.#configStats.x),
                    right: tankRect.right + (nextX - this.#configStats.x)
                };
            
                return !(
                    tankNew.top > objectRect.bottom - tolerance ||
                    tankNew.bottom < objectRect.top + tolerance ||
                    tankNew.left > objectRect.right - tolerance ||
                    tankNew.right < objectRect.left + tolerance
                );
            }

            for (let object of objects) {
                if (collision(nextX, nextY, this.body, object)) {
                    return true;
                }
            }

            return false;
        }
    }
    

    /**
     * @param {MouseEvent} event 
     */
    #rotateHead(event) {
        const rect = this.container.getBoundingClientRect();
        const { angle: tankAngle } = this.#configStats;

        // Gán vị trí trỏ chuột nếu có mouse event
        if(event) {
            this.#configStats.mouseX = event.clientX;
            this.#configStats.mouseY = event.clientY;
        }

        const { mouseX, mouseY } = this.#configStats;
        const targetX = mouseX - rect.left;
        const targetY = mouseY - rect.top;
        const tankRect = this.body.getBoundingClientRect();
        const tankCenterX = tankRect.left + tankRect.width / 2 - rect.left;
        const tankCenterY = tankRect.top + tankRect.height / 2 - rect.top;

        const deltaX = targetX - tankCenterX;
        const deltaY = targetY - tankCenterY;
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        this.head.style.transform = `translate(-50%, -50%) rotate(${angle - tankAngle}deg)`;
    }

    /**
     * @private
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} angle 
     */
    #createBullet(x, y, angle) {
        const bullet = document.createElement('div');
        if(this.body.classList.contains('space')) {
            bullet.classList.add('special');
        }
        const bulletSize = { width: 40, height: 115 };
        const collisionSize = 8;

        let { bulletSpeed, bulletRange } = this.#tankStats;
        let plusBulletSpeed = 0;
        let plusBulletRange = 0;

        // Buff tốc độ công
        for (const id in this.#buffStats.bulletSpeed) {
            const percent = this.#buffStats.bulletSpeed[id].value;
            if(percent) {
                plusBulletSpeed += bulletSpeed * percent / 100;
            }
        }
        bulletSpeed += plusBulletSpeed;
        
        // Buff tầm bắn
        for (const id in this.#buffStats.bulletRange) {
            const percent = this.#buffStats.bulletRange[id].value;
            if(percent) {
                plusBulletRange += bulletRange * percent / 100;
            }
        }
        bulletRange += plusBulletRange;

        bullet.classList.add('bullet');
        bullet.style.left = `${x}px`;
        bullet.style.top = `${y}px`;
        bullet.style.transform = `rotate(${angle}deg)`;
        this.container.appendChild(bullet);

        const radianAngle = angle * (Math.PI / 180);
        const velocityX = Math.cos(radianAngle) * bulletSpeed;
        const velocityY = Math.sin(radianAngle) * bulletSpeed;

        let traveledDistance = 0;

        const fly = () => {
            x += velocityX;
            y += velocityY;
            traveledDistance += bulletSpeed;

            if (traveledDistance >= bulletRange) {
                return bullet.remove();
            }

            bullet.style.left = `${x}px`;
            bullet.style.top = `${y}px`;

            // Kiểm tra va chạm với các vật thể khác
            const objects = this.container.querySelectorAll('.object');
            for (const object of objects) {
                if (checkCollision(bullet, object, 5)) {
                    const radianAngle = angle * (Math.PI / 180);
                    createCollisionEffect.bind(this)(x + Math.cos(radianAngle) * (bulletSize.width / 2 - collisionSize / Math.sqrt(2)), y + Math.sin(radianAngle) * (bulletSize.height / 2 - collisionSize / Math.sqrt(2)), angle);
                    this.#onBulletHit(bullet, object.tank);
                    object.tank?.body?.animate([
                        { boxShadow: 'none'},
                        { boxShadow: '0 0 5px white'},
                    ], {
                        duration: 200,
                        iterations: 1
                    });
                    break;
                }
            }

            requestAnimationFrame(fly);

            function createCollisionEffect(x, y, angle) {
                const effect = document.createElement('div');
                if(this.body.classList.contains('space')) {
                    effect.classList.add('special');
                }
                effect.classList.add('collision-effect');
            
                // Tính toán vị trí đầu viên đạn
                const radianAngle = angle * (Math.PI / 180);
                const bulletLength = 115; // Chiều dài viên đạn
                const collisionX = x + (bulletLength / 2) * Math.cos(radianAngle);
                const collisionY = y + (bulletLength / 2) * Math.sin(radianAngle);
            
                effect.style.left = `${collisionX}px`;
                effect.style.top = `${collisionY}px`;
            
                this.container.appendChild(effect);
                effect.addEventListener('animationend', () => effect.remove());
            }
    
            function checkCollision(bullet, object, tolerance = 0) {
                const bulletRect = bullet.getBoundingClientRect();
                const objectRect = object.getBoundingClientRect();
            
                return !(
                    bulletRect.top > objectRect.bottom - tolerance ||
                    bulletRect.bottom < objectRect.top + tolerance ||
                    bulletRect.left > objectRect.right - tolerance ||
                    bulletRect.right < objectRect.left + tolerance
                );
            }
        }

        fly();
    } 

    #shoot(event) {
        const currentTime = Date.now();
        const { lastShotTime } = this.#configStats;
        let { fireRate } = this.#tankStats;
        let plusFireRate = 0;

        // Buff tốc độ công
        for (const id in this.#buffStats.fireRate) {
            const percent = this.#buffStats.fireRate[id].value;
            if(percent) {
                plusFireRate += fireRate * percent / 100;
            }
        }
        fireRate += plusFireRate;

        // Không bắn nếu chưa hồi đạn
        if (currentTime - lastShotTime < 60000 / fireRate) {
            return; 
        }

        const rect = this.container.getBoundingClientRect();
        const targetX = event.clientX - rect.left;
        const targetY = event.clientY - rect.top;
        const tankHeadRect = this.head.getBoundingClientRect();
        const tankHeadCenterX = tankHeadRect.left + tankHeadRect.width / 2 - rect.left;
        const tankHeadCenterY = tankHeadRect.top + tankHeadRect.height / 2 - rect.top;

        const deltaX = targetX - tankHeadCenterX;
        const deltaY = targetY - tankHeadCenterY;
        const bulletAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        if(this.#buffStats['joint-strike']) {
            this.#jointShoot(tankHeadCenterX, tankHeadCenterY, bulletAngle);            
        } else if(this.#buffStats['disperse']) {
            this.#disperseShoot(tankHeadCenterX, tankHeadCenterY, bulletAngle);            
        } else {
            this.#createBullet(tankHeadCenterX, tankHeadCenterY, bulletAngle);            
        }

        this.#configStats.lastShotTime = currentTime; // Cập nhật thời gian bắn cuối cùng
    }

    #jointShoot(tankHeadCenterX, tankHeadCenterY, bulletAngle) {
        const timeout = (7 * 200) / this.#tankStats.bulletSpeed; // 200 is frame speed

        for(let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.#createBullet(tankHeadCenterX, tankHeadCenterY, bulletAngle);
            }, timeout * i);
        }
    }

    #disperseShoot(tankHeadCenterX, tankHeadCenterY, bulletAngle) {
        this.#createBullet(tankHeadCenterX, tankHeadCenterY, bulletAngle - 15);
        this.#createBullet(tankHeadCenterX, tankHeadCenterY, bulletAngle);
        this.#createBullet(tankHeadCenterX, tankHeadCenterY, bulletAngle + 15);
    }

    #autoShoot() {
        const currentTime = Date.now();
        const { lastShotTime, autoFire, mouseX, mouseY } = this.#configStats;
        let { fireRate } = this.#tankStats;
        let plusFireRate = 0;

        // Buff tốc độ công
        for (const id in this.#buffStats.fireRate) {
            const percent = this.#buffStats.fireRate[id].value;
            if(percent) {
                plusFireRate += fireRate * percent / 100;
            }
        }
        fireRate += plusFireRate;

        if (currentTime - lastShotTime >= 60000 / fireRate && autoFire) {
            const rect = this.container.getBoundingClientRect();
            const targetX = mouseX - rect.left;
            const targetY = mouseY - rect.top;
            const tankHeadRect = this.head.getBoundingClientRect();
            const tankHeadCenterX = tankHeadRect.left + tankHeadRect.width / 2 - rect.left;
            const tankHeadCenterY = tankHeadRect.top + tankHeadRect.height / 2 - rect.top;

            const deltaX = targetX - tankHeadCenterX;
            const deltaY = targetY - tankHeadCenterY;
            const bulletAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            if(this.#buffStats['joint-strike']) {
                this.#jointShoot(tankHeadCenterX, tankHeadCenterY, bulletAngle);            
            } else if(this.#buffStats['disperse']) {
                this.#disperseShoot(tankHeadCenterX, tankHeadCenterY, bulletAngle);            
            } else {
                this.#createBullet(tankHeadCenterX, tankHeadCenterY, bulletAngle);            
            }

            this.#configStats.lastShotTime = currentTime; // Cập nhật thời gian bắn cuối cùng
        }

        requestAnimationFrame(this.#autoShoot.bind(this));
    }

    #onBulletHit(bullet, target) {
        if(target) {
            this.buff('movingSpeed', 10, 2, 'passive', {stack: true, maxStack: 5});
            this.buff('fireRate', 10, 2, 'passive', {stack: true, maxStack: 5});
        }

        bullet.remove();
    }
}