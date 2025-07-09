---
title: "SetControllerReference or SetOwnerReference"
tags: ["controller-runtime"]
date: 2025-07-06
---
# SetControllerReference or SetOwnerReference

两个方法都是`controller-runtime`中的方法,而且作用很相似,都是对`ownerReferences`进行设置, 但是会有细微的区别. 这也会导致如果在自己的`controller`中创建子资源时使用`SetOwnerReference` 会出现无法监听子资源的增删改等事件

`SetControllerReference` 的定义如下:
```go
// SetControllerReference sets owner as a Controller OwnerReference on controlled.
// This is used for garbage collection of the controlled object and for
// reconciling the owner object on changes to controlled (with a Watch + EnqueueRequestForOwner).
// Since only one OwnerReference can be a controller, it returns an error if
// there is another OwnerReference with Controller flag set.
func SetControllerReference(owner, controlled metav1.Object, scheme *runtime.Scheme) error {
    // Validate the owner.
    ro, ok := owner.(runtime.Object)
    if !ok {
        return fmt.Errorf("%T is not a runtime.Object, cannot call SetControllerReference", owner)
    }
    if err := validateOwner(owner, controlled); err != nil {
        return err
    }
    // Create a new controller ref.
    gvk, err := apiutil.GVKForObject(ro, scheme)
    if err != nil {
        return err
    }
    ref := metav1.OwnerReference{
        APIVersion:         gvk.GroupVersion().String(),
        Kind:               gvk.Kind,
        Name:               owner.GetName(),
        UID:                owner.GetUID(),
        BlockOwnerDeletion: pointer.Bool(true),
        Controller:         pointer.Bool(true),
    }
    // Return early with an error if the object is already controlled.
    if existing := metav1.GetControllerOf(controlled); existing != nil && !referSameObject(*existing, ref) {
        return newAlreadyOwnedError(controlled, *existing)
    }
    // Update owner references and return.
    upsertOwnerRef(ref, controlled)
    return nil
}

```

`SetOwnerReference` 的函数定义如下:
```go
// SetOwnerReference is a helper method to make sure the given object contains an object reference to the object provided.
// This allows you to declare that owner has a dependency on the object without specifying it as a controller.
// If a reference to the same object already exists, it'll be overwritten with the newly provided version.
func SetOwnerReference(owner, object metav1.Object, scheme *runtime.Scheme) error {
	// Validate the owner.
	ro, ok := owner.(runtime.Object)
	if !ok {
		return fmt.Errorf("%T is not a runtime.Object, cannot call SetOwnerReference", owner)
	}
	if err := validateOwner(owner, object); err != nil {
		return err
	}

	// Create a new owner ref.
	gvk, err := apiutil.GVKForObject(ro, scheme)
	if err != nil {
		return err
	}
	ref := metav1.OwnerReference{
		APIVersion: gvk.GroupVersion().String(),
		Kind:       gvk.Kind,
		UID:        owner.GetUID(),
		Name:       owner.GetName(),
	}

	// Update owner references and return.
	upsertOwnerRef(ref, object)
	return nil
}
```

对比上述定义, 可以发现`SetControllerReference` 会额外设置两个字段的值为`true` : `Controller` 和 `BlockOwnerDeletion` , `Controller` 将这个资源设置为受属主控制器控制的对象. 有了这个值,才会将附属资源的事件变化传递给对应的Controller

另外通过代码中的定义可以发现,一个资源对象只能拥有一个 controller 值为 true 的OwnerReference

官方API字段说明
https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/object-meta/