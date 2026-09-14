<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierRequest;
use App\Models\Supplier;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('suppliers/index', [
            'suppliers' => Supplier::orderBy('name')->paginate(20),
        ]);
    }

    public function store(StoreSupplierRequest $request)
    {
        Supplier::create($request->validated());

        return redirect()->back()->with('success', 'Supplier dibuat.');
    }

    public function update(StoreSupplierRequest $request, Supplier $supplier)
    {
        $supplier->update($request->validated());

        return redirect()->back()->with('success', 'Supplier diupdate.');
    }
}
