const orderButton = document.getElementById('configure');
orderButton.addEventListener('click', function() {
    const newWin = window.open('order.html', '_blank');
            if (newWin) newWin.focus();
});

