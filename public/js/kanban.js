
    $(function () {
        $('#sortable-wrapper').sortable();
    });

    $(function () {
        $('#sortable1, #sortable2, #sortable3').sortable({
            connectWith: '.connectedSortable'
        }).disableSelection();
    });

// <!--=========================== Delete & Duplicate js code start ==============================-->

    // Duplicate Item js
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.duplicate-button').forEach(button => {
            button.addEventListener('click', function () {
                // Find the closest card to the clicked button
                const card = this.closest('.kanban-item');
                // Clone the card
                const clone = card.cloneNode(true);
                // Append the cloned card to the parent container
                card.parentNode.appendChild(clone);

                // Add event listener to delete button of the cloned card
                clone.querySelector('.delete-button').addEventListener('click', function () {
                    clone.remove();
                });
            });
        });

        $(document).on('click', '.delete-button', function () {
            $(this).closest('.kanban-item').addClass('d-none');
        });
    });

{/* <!--=========================== Delete & Duplicate js code End ==============================--> */}
{/* <!--=========================== Add new Task & Edit Task js code Start ==============================--> */}

    document.addEventListener('DOMContentLoaded', function () {
        // Show the modal to add a new task
        document.querySelectorAll('.add-kanban, .add-task-button').forEach(button => {
            button.addEventListener('click', function () {
                var addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
                document.getElementById('editTaskId').value = ''; // Clear edit ID
                document.getElementById('taskTitle').value = ''; // Clear title
                document.getElementById('taskDescription').value = ''; // Clear description
                document.getElementById('taskTag').value = ''; // Clear Tag
                document.getElementById('startDate').value = ''; // Clear Date
                document.getElementById('taskImage').value = ''; // Clear file input
                document.getElementById('taskImagePreview').style.display = 'none'; // Hide image preview
                document.getElementById('taskImagePreview').src = ''; // Clear image preview
                addTaskModal.show();
            });
        });

        // Preview the image when a file is selected
        document.getElementById('taskImage').addEventListener('change', function () {
            var file = this.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('taskImagePreview').src = e.target.result;
                document.getElementById('taskImagePreview').style.display = 'block';
            };
            if (file) {
                reader.readAsDataURL(file);
            }
        });

        // Save task button click handler
        document.getElementById('saveTaskButton').addEventListener('click', function () {
            var title = document.getElementById('taskTitle').value;
            var description = document.getElementById('taskDescription').value;
            var tag = document.getElementById('taskTag').value;
            var date = document.getElementById('startDate').value;
            var editTaskId = document.getElementById('editTaskId').value;
            var imageSrc = document.getElementById('taskImagePreview').src;

            if (title === '' || description === '') {
                alert('Title and Description cannot be empty');
                return;
            }

            var kanbanCardHTML = `
                                    <div class='kanban-card bg-neutral-50 p-16 radius-8 mb-24' id='${editTaskId ? editTaskId : 'kanban-' + new Date().getTime()}'>
                                        ${imageSrc ? `<div class='radius-8 mb-12 max-h-350-px overflow-hidden'><img src='${imageSrc}' alt='' class='w-100 h-100 object-fit-cover'></div>` : ''}
                                        <h6 class='kanban-title text-lg fw-semibold mb-8'>${title}</h6>
                                        <p class='kanban-desc text-secondary-light'>${description}</p>
                                        <button type='button' class='start-date btn text-primary-600 border rounded border-primary-600 bg-hover-primary-600 text-hover-white d-flex align-items-center gap-2'>
                                            <iconify-icon icon='lucide:tag' class='icon'></iconify-icon> <span class='kanban-tag fw-semibold'>${tag}</span>
                                        </button>
                                        <div class='mt-12 d-flex align-items-center justify-content-between gap-10'>
                                            <div class='d-flex align-items-center justify-content-between gap-10'>
                                                <iconify-icon icon='solar:calendar-outline' class='text-primary-light'></iconify-icon>
                                                <span class='start-date text-secondary-light'>${date}</span>
                                            </div>
                                            <div class='d-flex align-items-center justify-content-between gap-10'>
                                                <button type='button' class='card-edit-button text-success-600'><iconify-icon icon='lucide:edit' class='icon text-lg line-height-1'></iconify-icon></button>
                                                <button type='button' class='card-delete-button text-danger-600'><iconify-icon icon='fluent:delete-24-regular' class='icon text-lg line-height-1'></iconify-icon></button>
                                            </div>
                                        </div>
                                    </div>
                                    `;

            if (editTaskId) {
                // Edit existing card
                var editCard = document.getElementById(editTaskId);
                if (editCard) {
                    editCard.outerHTML = kanbanCardHTML;
                }
            } else {
                // Add new card
                var targetKanbanItem = document.querySelector('.kanban-item');
                if (targetKanbanItem) {
                    var firstKanbanCard = targetKanbanItem.querySelector('.card-body .kanban-card');
                    if (firstKanbanCard) {
                        firstKanbanCard.insertAdjacentHTML('beforebegin', kanbanCardHTML);
                    } else {
                        targetKanbanItem.querySelector('.card-body').insertAdjacentHTML('afterbegin', kanbanCardHTML);
                    }
                }
            }

            var addTaskModal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
            addTaskModal.hide();
        });

        // Delegate edit and delete button events to dynamically added kanban cards
        document.addEventListener('click', function (e) {
            if (e.target.closest('.card-edit-button')) {
                var card = e.target.closest('.kanban-card');
                document.getElementById('taskTitle').value = card.querySelector('.kanban-title').textContent;
                document.getElementById('taskDescription').value = card.querySelector('.kanban-desc').textContent;
                document.getElementById('taskTag').value = card.querySelector('.kanban-tag').textContent;
                document.getElementById('startDate').value = card.querySelector('.start-date').textContent;
                document.getElementById('editTaskId').value = card.id;
                var img = card.querySelector('img');
                if (img) {
                    document.getElementById('taskImagePreview').src = img.src;
                    document.getElementById('taskImagePreview').style.display = 'block';
                } else {
                    document.getElementById('taskImagePreview').style.display = 'none';
                    document.getElementById('taskImagePreview').src = '';
                }

                var addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
                addTaskModal.show();
            }
            if (e.target.closest('.card-delete-button')) {
                var card = e.target.closest('.kanban-card');
                if (card) {
                    card.remove();
                }
            }
        });
    });