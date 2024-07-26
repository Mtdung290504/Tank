const container = document.querySelector('#container');

const tank1 = new Tank(
    {
        movingSpeed: 180,
        bulletRange: 336,
        bulletSpeed: 15,
        fireRate: 80,
    }, 
    container
)
.place(20, 20)
.control()
.attach();

// tank1.buff('movingSpeed', 30, Infinity, 'passive');

const tank2 = new Tank(
    {
        movingSpeed: 170,
        bulletRange: 520,
        bulletSpeed:5,
        fireRate: 30,
    }, 
    container
)
.place(1000, 750)
.attach();

tank2.body.classList.add('object');

// Tạo vật thể để kiểm tra va chạm
// object(300, 300);
// object(450, 400);
// object(650, 650);
// object(650, 700);
object(300, 500, 600, 50);
object(900, 0, 400, 110);
object(100, 700, 400, 110);

function object(left, top, width = 50, height = 50) {
    const object = document.createElement('div');
    object.classList.add('object');
    object.style.position = 'absolute';
    object.style.width = `${width}px`;
    object.style.height = `${height}px`;
    object.style.left = `${left}px`;
    object.style.top = `${top}px`;
    object.style.backgroundColor = '#222';
    container.appendChild(object);
}