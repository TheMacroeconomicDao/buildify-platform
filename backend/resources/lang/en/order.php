<?php

return [
    'Order' => 'Order',
    'executor' => [
        'already_selected' => 'Executor already selected',
        'only_executor_can_store_response' => 'Only executor can store response',
        'only_executor_and_mediator_can_store_response' => 'Only executor and mediator can store response',
        'only_executor_can_revoke_response' => 'Only executor can revoke a response',
        'only_executor_can_take_on_work' => 'Only selected executor can take order to work',
        'executor_not_selected_for_order' => 'Executor is not selected for this order',
        'order_not_in_executor_selected_status' => 'Order must be in "Executor Selected" status',
        'response_not_in_order_received_status' => 'Response must be in "Order Received" status',
        'only_executor_can_complete_order' => 'Only executor can complete order',
        'order_must_be_in_work' => 'Order must be in work or rejected',
        'must_be_assigned_to_order' => 'Executor must be assigned to this order',
        'only_executor_can_send_contact' => 'Only executor can send their contacts',
        'customer_must_send_contacts_first' => 'Customer must send their contacts first',
        'must_be_selected_first' => 'Executor must be selected by customer first',
        'selected_notification_subject' => 'You have been selected for an order!',
        'selected_notification_title' => 'You have been selected for an order',
        'selected_notification_message' => 'Congratulations! You have been selected to execute order ":order_title" (#:order_id). Please confirm acceptance within 24 hours.',
    ],
    'customer' => [
        'only_author_can_reject_response' => 'Only author can reject executor\'s response',
        'only_author_can_select_response' => 'Only author can select executor',
        'only_author_can_send_contact' => 'Only author can send contacts to executor',
        'responses_are_available_only_to_author' => 'Responses are available only to author',
        'only_author_can_cancel' => 'Only author can cancel order',
        'only_author_can_create' => 'Only author can create order',
        'only_author_can_accept_work' => 'Only order author can accept work',
        'only_author_can_reject_work' => 'Only order author can reject work',
        'only_author_can_complete_order' => 'Only order author can complete order',
        'order_must_be_awaiting_confirmation' => 'Order must be in "Awaiting Confirmation" status',
        'order_must_be_in_work' => 'Order must be in work',
        'only_author_can_leave_review' => 'Only order author can leave a review',
    ],
    'status' => [
        'cannot_cancel' => 'Can only change to this status from "Search Executor" and "Selecting Executor" order statuses',
        'must_be_closed_for_review' => 'Order must be completed to leave a review',
        'must_be_awaiting_confirmation_or_completed_for_review' => 'Order must be awaiting confirmation or completed to leave a review',
    ],
    'review' => [
        'already_exists' => 'Review for this order already exists',
        'rating' => [
            'required' => 'Rating is required',
            'must_be_integer' => 'Rating must be an integer',
            'must_be_between_1_and_5' => 'Rating must be between 1 and 5',
        ],
        'text' => [
            'required' => 'Review text is required',
            'max_length' => 'Review text must not exceed 1000 characters',
        ],
    ],
    'id' => [
        'required' => 'Order ID is required',
    ],
    'not_found' => 'Order not found',
];
