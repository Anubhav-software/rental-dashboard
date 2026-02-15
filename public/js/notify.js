/**
 * Toast notifications (Toastify) and confirm dialog (SweetAlert2).
 * Use showToast(msg, type) and confirmUpdate(title, text, onConfirm).
 */
(function () {
  'use strict';

  if (typeof Toastify !== 'undefined') {
    window.showToast = function (message, type) {
      type = type || 'success';
      var isSuccess = type === 'success';
      var options = {
        text: message || (isSuccess ? 'Done!' : 'Something went wrong.'),
        duration: 3500,
        gravity: 'top',
        position: 'right',
        stopOnFocus: true,
        style: {
          background: isSuccess
            ? 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)'
            : 'linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%)',
          color: '#fff',
          borderRadius: '12px',
          padding: '14px 20px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          fontSize: '14px'
        }
      };
      Toastify(options).showToast();
    };
  }

  window.confirmUpdate = function (options, onConfirm) {
    var title = (options && options.title) || 'Are you sure?';
    var text = (options && options.text) || 'You are about to edit the details!';
    if (typeof Swal === 'undefined') {
      if (window.confirm(title + ' ' + text) && typeof onConfirm === 'function') onConfirm();
      return;
    }
    Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'No, cancel!'
    }).then(function (result) {
      if (result && result.isConfirmed && typeof onConfirm === 'function') onConfirm();
    });
  };
})();
